export const typeDefs = `#graphql
  enum Category {
    food
    groceries
    transport
    shopping
    bills
    entertainment
    health
    travel
    education
    other
  }

  enum ExpenseSource {
    manual
    text
    receipt
  }

  type Expense {
    id: ID!
    amount: Float!
    currency: String!
    category: Category!
    merchant: String!
    date: String!
    note: String!
    source: ExpenseSource!
    createdAt: String!
  }

  "What the AI extracted. Shown to the user for review before saving."
  type ParsedExpense {
    amount: Float!
    currency: String!
    category: Category!
    merchant: String!
    date: String!
    note: String!
    confidence: Float!
  }

  type CategoryTotal {
    category: Category!
    total: Float!
  }

  input ExpenseInput {
    amount: Float!
    currency: String
    category: Category!
    merchant: String
    date: String!
    note: String
    source: ExpenseSource
  }

  input ExpenseFilter {
    "YYYY-MM"
    month: String
    category: Category
  }

  type Query {
    expenses(filter: ExpenseFilter): [Expense!]!
    categoryTotals(month: String): [CategoryTotal!]!
  }

  type Mutation {
    "AI: turn a sentence like 'paid 450 for swiggy yesterday' into an expense draft"
    parseExpenseText(text: String!, today: String!): ParsedExpense!
    "AI: read a receipt photo (base64, without the data: prefix) into an expense draft"
    parseReceipt(imageBase64: String!, mediaType: String!, today: String!): ParsedExpense!

    addExpense(input: ExpenseInput!): Expense!
    deleteExpense(id: ID!): Boolean!
  }
`;
