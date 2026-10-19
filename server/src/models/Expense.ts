import { Schema, model, type InferSchemaType } from "mongoose";

export const CATEGORIES = [
  "food",
  "groceries",
  "transport",
  "shopping",
  "bills",
  "entertainment",
  "health",
  "travel",
  "education",
  "other",
] as const;

const expenseSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    category: { type: String, required: true, enum: CATEGORIES },
    merchant: { type: String, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD, keeps month filters simple
    note: { type: String, default: "" },
    source: { type: String, enum: ["manual", "text", "receipt"], default: "manual" },
    // TODO(auth): add userId once login is in place, and filter every query by it.
  },
  { timestamps: true },
);

expenseSchema.index({ date: -1 });

export type ExpenseDoc = InferSchemaType<typeof expenseSchema>;
export const Expense = model("Expense", expenseSchema);
