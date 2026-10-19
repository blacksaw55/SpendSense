import { gql } from "@apollo/client";
import type { TypedDocumentNode } from "@apollo/client";

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

export type Category = (typeof CATEGORIES)[number];
export type ExpenseSource = "manual" | "text" | "receipt";

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: Category;
  merchant: string;
  date: string;
  note: string;
  source: ExpenseSource;
}

export interface ParsedExpense {
  amount: number;
  currency: string;
  category: Category;
  merchant: string;
  date: string;
  note: string;
  confidence: number;
}

export interface ExpenseInput {
  amount: number;
  currency: string;
  category: Category;
  merchant: string;
  date: string;
  note: string;
  source: ExpenseSource;
}

// TODO: replace these hand-written types with GraphQL Code Generator output.

export const EXPENSES: TypedDocumentNode<
  { expenses: Expense[] },
  { filter: { month?: string; category?: Category } }
> = gql`
  query Expenses($filter: ExpenseFilter) {
    expenses(filter: $filter) {
      id
      amount
      currency
      category
      merchant
      date
      note
      source
    }
  }
`;

export const CATEGORY_TOTALS: TypedDocumentNode<
  { categoryTotals: { category: Category; total: number }[] },
  { month?: string }
> = gql`
  query CategoryTotals($month: String) {
    categoryTotals(month: $month) {
      category
      total
    }
  }
`;

const PARSED_FIELDS = `
  amount
  currency
  category
  merchant
  date
  note
  confidence
`;

export const PARSE_EXPENSE_TEXT: TypedDocumentNode<
  { parseExpenseText: ParsedExpense },
  { text: string; today: string }
> = gql`
  mutation ParseExpenseText($text: String!, $today: String!) {
    parseExpenseText(text: $text, today: $today) { ${PARSED_FIELDS} }
  }
`;

export const PARSE_RECEIPT: TypedDocumentNode<
  { parseReceipt: ParsedExpense },
  { imageBase64: string; mediaType: string; today: string }
> = gql`
  mutation ParseReceipt($imageBase64: String!, $mediaType: String!, $today: String!) {
    parseReceipt(imageBase64: $imageBase64, mediaType: $mediaType, today: $today) { ${PARSED_FIELDS} }
  }
`;

export const ADD_EXPENSE: TypedDocumentNode<{ addExpense: Expense }, { input: ExpenseInput }> = gql`
  mutation AddExpense($input: ExpenseInput!) {
    addExpense(input: $input) {
      id
    }
  }
`;

export const DELETE_EXPENSE: TypedDocumentNode<{ deleteExpense: boolean }, { id: string }> = gql`
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id)
  }
`;

/** Queries to refresh after the expense list changes. */
export const EXPENSE_QUERIES = ["Expenses", "CategoryTotals"];
