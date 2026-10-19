import { useMutation, useQuery } from "@apollo/client/react";
import { useAppSelector } from "../app/store";
import { DELETE_EXPENSE, EXPENSE_QUERIES, EXPENSES } from "../graphql/operations";
import { formatMoney } from "../utils";

const SOURCE_LABEL = { manual: "", text: "AI text", receipt: "AI receipt" } as const;

export function ExpenseList() {
  const { month, category } = useAppSelector((state) => state.expenses);
  const { data, loading, error } = useQuery(EXPENSES, {
    variables: { filter: { month, ...(category ? { category } : {}) } },
  });
  const [deleteExpense] = useMutation(DELETE_EXPENSE, { refetchQueries: EXPENSE_QUERIES });

  if (loading) return <p className="text-sm text-slate-500">Loading expenses…</p>;
  if (error) return <p className="text-sm text-red-600">{error.message}</p>;

  const expenses = data?.expenses ?? [];
  if (expenses.length === 0) {
    return <p className="text-sm text-slate-500">No expenses for this month. Add one above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
      {expenses.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{e.note || e.merchant || e.category}</p>
            <p className="text-xs text-slate-500">
              {e.date} · <span className="capitalize">{e.category}</span>
              {e.merchant && ` · ${e.merchant}`}
              {SOURCE_LABEL[e.source] && ` · ${SOURCE_LABEL[e.source]}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">{formatMoney(e.amount, e.currency)}</span>
            <button
              onClick={() => deleteExpense({ variables: { id: e.id } }).catch(() => undefined)}
              className="text-xs text-slate-400 hover:text-red-600"
              aria-label={`Delete ${e.note || e.category}`}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
