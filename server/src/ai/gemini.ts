import { ApiError, GoogleGenAI, type Part } from "@google/genai";
import { z } from "zod";
import { CATEGORIES } from "../models/Expense.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  // Gemini returns 503 "high demand" / 429 at busy times; retry a few times with backoff.
  httpOptions: { retryOptions: { attempts: 3, initialDelay: 1, maxDelay: 4 } },
});
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
// Used when the main model is overloaded (503) or rate-limited (429).
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.6-flash";

export const ParsedExpenseSchema = z.object({
  amount: z.number().describe("Total amount paid, as a positive number"),
  currency: z.string().describe("ISO 4217 code, e.g. INR"),
  category: z.enum(CATEGORIES),
  merchant: z.string().describe("Shop, app or person paid; empty string if unknown"),
  date: z.string().describe("Date of the expense, YYYY-MM-DD"),
  note: z.string().describe("Short description of what was bought"),
  confidence: z.number().describe("0 to 1: how sure you are about the extracted fields"),
});

export type ParsedExpense = z.infer<typeof ParsedExpenseSchema>;

const RESPONSE_SCHEMA = z.toJSONSchema(ParsedExpenseSchema);

const SYSTEM_PROMPT = `You turn a user's expense (a sentence or a receipt image) into one structured transaction.
Rules:
- Default currency is INR unless another currency is clearly stated.
- Resolve relative dates ("yesterday", "last Friday") against today's date, which the user message gives you. If no date is given, use today.
- Pick the closest category; use "other" only when nothing fits.
- For receipts, use the final total paid (after tax and discounts), not a line item.
- Lower the confidence when you had to guess any field.`;

export class AiParseError extends Error {}

function generate(model: string, parts: Part[]) {
  return ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: RESPONSE_SCHEMA,
    },
  });
}

async function generateWithFallback(parts: Part[]) {
  try {
    return await generate(MODEL, parts);
  } catch (error) {
    const busy = error instanceof ApiError && (error.status === 503 || error.status === 429);
    if (!busy || FALLBACK_MODEL === MODEL) throw error;
    console.warn(`${MODEL} is busy (${error.status}); retrying on ${FALLBACK_MODEL}`);
    return generate(FALLBACK_MODEL, parts);
  }
}

async function parseExpense(parts: Part[]): Promise<ParsedExpense> {
  const response = await generateWithFallback(parts);

  if (response.promptFeedback?.blockReason) {
    throw new AiParseError("The AI declined to read this expense. Please enter it manually.");
  }

  // Gemini follows the schema, but validate anyway before trusting the data.
  let json: unknown;
  try {
    json = JSON.parse(response.text ?? "");
  } catch {
    throw new AiParseError("Could not understand this expense. Try rephrasing it.");
  }
  const parsed = ParsedExpenseSchema.safeParse(json);
  if (!parsed.success) {
    throw new AiParseError("Could not understand this expense. Try rephrasing it.");
  }
  return parsed.data;
}

/** "paid 450 for swiggy dinner yesterday" -> structured expense */
export function parseExpenseText(text: string, today: string): Promise<ParsedExpense> {
  return parseExpense([{ text: `Today is ${today}.\nExpense: ${text}` }]);
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Receipt photo (base64) -> structured expense */
export function parseReceiptImage(base64: string, mediaType: string, today: string): Promise<ParsedExpense> {
  if (!IMAGE_TYPES.includes(mediaType)) {
    throw new AiParseError(`Unsupported image type ${mediaType}. Use JPEG, PNG, GIF or WebP.`);
  }
  return parseExpense([
    { inlineData: { mimeType: mediaType, data: base64 } },
    { text: `Today is ${today}. Extract the expense from this receipt.` },
  ]);
}
