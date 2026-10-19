import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Category, ExpenseSource, ParsedExpense } from "../../graphql/operations";
import { localToday } from "../../utils";

/** An expense the AI extracted, waiting for the user to review and save. */
export interface Draft extends ParsedExpense {
  source: ExpenseSource;
}

interface ExpensesState {
  month: string; // YYYY-MM
  category: Category | null;
  draft: Draft | null;
}

const initialState: ExpensesState = {
  month: localToday().slice(0, 7),
  category: null,
  draft: null,
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    monthChanged(state, action: PayloadAction<string>) {
      state.month = action.payload;
    },
    categoryChanged(state, action: PayloadAction<Category | null>) {
      state.category = action.payload;
    },
    draftCreated(state, action: PayloadAction<Draft>) {
      state.draft = action.payload;
    },
    draftEdited(state, action: PayloadAction<Partial<Draft>>) {
      if (state.draft) Object.assign(state.draft, action.payload);
    },
    draftCleared(state) {
      state.draft = null;
    },
  },
});

export const { monthChanged, categoryChanged, draftCreated, draftEdited, draftCleared } = expensesSlice.actions;
export default expensesSlice.reducer;
