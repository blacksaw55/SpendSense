# SpendSense: AI Expense Tracker

Track spending in plain English. Type *"paid 450 for Swiggy dinner yesterday"* or upload a receipt photo, and the AI turns it into a structured expense you can review before saving.

**Stack:** React 19 + TypeScript (Vite), Redux Toolkit, Apollo Client · Node.js, Express, Apollo Server (GraphQL), MongoDB (Mongoose) · Gemini API with structured JSON output · Tailwind CSS

## Features

- [x] **Natural-language entry**: a sentence becomes amount, category, merchant, date and note (Gemini JSON-schema output, validated with Zod)
- [x] **Receipt scan**: upload a photo and the AI fills in the expense
- [x] **Review before save**: AI draft is editable, with a low-confidence warning
- [x] Expense list with month and category filters, delete
- [x] Spending per category for the month
- [ ] **Ask your data**: "how much did I spend on food in September?" (AI turns the question into a GraphQL query)
- [ ] **Monthly AI insight**: one-click summary of spending patterns
- [ ] Login (JWT) and per-user expenses
- [ ] GraphQL Code Generator for types, tests, deploy (Vercel + Render + MongoDB Atlas)

## Run locally

Requires Node.js 20+.

```bash
npm install
cp server/.env.example server/.env   # then add your GEMINI_API_KEY
npm run dev
```

- App: http://localhost:5173
- GraphQL API: http://localhost:4000/graphql (open it in a browser for the Apollo Sandbox)

If `MONGODB_URI` is empty, the server starts a throwaway in-memory MongoDB (the first run downloads it, about 780 MB, and data resets on restart). For real use, create a free MongoDB Atlas cluster and set `MONGODB_URI`.

`GEMINI_MODEL` defaults to `gemini-3.8-flash`. Get a free key at https://aistudio.google.com/apikey.

## Project structure

```
server/src/
  ai/gemini.ts          Gemini calls: text and receipt -> structured expense (Zod schema)
  graphql/schema.ts     GraphQL type definitions
  graphql/resolvers.ts  Queries, mutations, AI error handling
  models/Expense.ts     Mongoose model + categories
client/src/
  app/store.ts                          Redux store + typed hooks
  features/expenses/expensesSlice.ts    Filters + AI draft state
  graphql/operations.ts                 Typed GraphQL documents
  components/                           QuickAdd, DraftReview, ExpenseList, Filters, CategorySummary
```
