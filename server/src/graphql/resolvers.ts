import { ApiError } from "@google/genai";
import { GraphQLError } from "graphql";
import type { QueryFilter } from "mongoose";
import { AiParseError, parseExpenseText, parseReceiptImage } from "../ai/gemini.js";
import { Expense, type ExpenseDoc } from "../models/Expense.js";

interface ExpenseFilter {
  month?: string;
  category?: ExpenseDoc["category"];
}

const MAX_TEXT_LENGTH = 500;

function buildFilter(filter?: ExpenseFilter): QueryFilter<ExpenseDoc> {
  const query: QueryFilter<ExpenseDoc> = {};
  // Dates are stored as YYYY-MM-DD, so a month is a prefix match.
  if (filter?.month) query.date = { $regex: `^${filter.month.replace(/[^0-9-]/g, "")}` };
  if (filter?.category) query.category = filter.category;
  return query;
}

// Return AI failures as readable GraphQL errors instead of a generic 500.
async function withAiErrors<T>(fn: () => Promise<T>): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new GraphQLError("AI is not configured: add GEMINI_API_KEY to server/.env and restart the server.", {
      extensions: { code: "AI_NOT_CONFIGURED" },
    });
  }
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AiParseError) {
      throw new GraphQLError(error.message, { extensions: { code: "AI_PARSE_FAILED" } });
    }
    console.error("AI request failed:", error);
    if (error instanceof ApiError && (error.status === 503 || error.status === 429)) {
      throw new GraphQLError("The AI is busy right now. Please try again in a minute.", {
        extensions: { code: "AI_BUSY" },
      });
    }
    throw new GraphQLError("The AI service is unavailable right now. Please try again.", {
      extensions: { code: "AI_UNAVAILABLE" },
    });
  }
}

export const resolvers = {
  Query: {
    expenses: (_: unknown, { filter }: { filter?: ExpenseFilter }) =>
      // .exec() returns a real Promise; GraphQL re-awaiting a bare Mongoose query runs it twice and throws.
      Expense.find(buildFilter(filter)).sort({ date: -1, createdAt: -1 }).exec(),

    categoryTotals: (_: unknown, { month }: { month?: string }) =>
      Expense.aggregate([
        { $match: buildFilter({ month }) },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $project: { _id: 0, category: "$_id", total: 1 } },
        { $sort: { total: -1 } },
      ]).exec(),
  },

  Mutation: {
    parseExpenseText: (_: unknown, { text, today }: { text: string; today: string }) => {
      if (!text.trim() || text.length > MAX_TEXT_LENGTH) {
        throw new GraphQLError(`Enter between 1 and ${MAX_TEXT_LENGTH} characters.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      return withAiErrors(() => parseExpenseText(text, today));
    },

    parseReceipt: (
      _: unknown,
      { imageBase64, mediaType, today }: { imageBase64: string; mediaType: string; today: string },
    ) => withAiErrors(() => parseReceiptImage(imageBase64, mediaType, today)),

    addExpense: (_: unknown, { input }: { input: Record<string, unknown> }) => Expense.create(input),

    deleteExpense: async (_: unknown, { id }: { id: string }) => {
      const result = await Expense.findByIdAndDelete(id);
      return result !== null;
    },
  },

  Expense: {
    createdAt: (expense: { createdAt: Date }) => expense.createdAt.toISOString(),
  },
};
