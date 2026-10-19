import { useMutation } from "@apollo/client/react";
import type { FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../app/store";
import { draftCleared, draftEdited } from "../features/expenses/expensesSlice";
import { ADD_EXPENSE, CATEGORIES, EXPENSE_QUERIES, type Category } from "../graphql/operations";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2";

/** Lets the user check and correct what the AI extracted before saving it. */
export function DraftReview() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.expenses.draft);
  const [addExpense, { loading, error }] = useMutation(ADD_EXPENSE, { refetchQueries: EXPENSE_QUERIES });

  if (!draft) return null;

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    // Pick fields explicitly: the draft came from an Apollo query result, which also carries
    // __typename, and GraphQL rejects unknown fields on an input type.
    const { amount, currency, category, merchant, date, note, source } = draft;
    const input = { amount, currency, category, merchant, date, note, source };
    const result = await addExpense({ variables: { input } }).catch(() => null);
    if (result?.data) dispatch(draftCleared());
  }

  const lowConfidence = draft.confidence < 0.7;

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Check the details</h2>
        <span className={`text-xs ${lowConfidence ? "text-amber-700" : "text-slate-500"}`}>
          {lowConfidence ? "AI was unsure, please double-check" : `AI confidence ${Math.round(draft.confidence * 100)}%`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Amount ({draft.currency})
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={draft.amount}
            onChange={(e) => dispatch(draftEdited({ amount: Number(e.target.value) }))}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          Date
          <input
            type="date"
            required
            value={draft.date}
            onChange={(e) => dispatch(draftEdited({ date: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          Category
          <select
            value={draft.category}
            onChange={(e) => dispatch(draftEdited({ category: e.target.value as Category }))}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Merchant
          <input
            value={draft.merchant}
            onChange={(e) => dispatch(draftEdited({ merchant: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Note
          <input
            value={draft.note}
            onChange={(e) => dispatch(draftEdited({ note: e.target.value }))}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}

      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50">
          {loading ? "Saving…" : "Save expense"}
        </button>
        <button type="button" onClick={() => dispatch(draftCleared())} className="rounded-lg border border-slate-300 bg-white px-4 py-2">
          Discard
        </button>
      </div>
    </form>
  );
}
