import { useQuery } from "@apollo/client/react";
import { useAppSelector } from "../app/store";
import { CATEGORY_TOTALS } from "../graphql/operations";
import { formatMoney } from "../utils";

/** Spending per category for the selected month, as simple bars. */
export function CategorySummary() {
  const month = useAppSelector((state) => state.expenses.month);
  const { data, loading, error } = useQuery(CATEGORY_TOTALS, { variables: { month } });

  const totals = data?.categoryTotals ?? [];
  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);
  const max = Math.max(...totals.map((t) => t.total), 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">This month</h2>
        <span className="text-lg font-semibold">{formatMoney(grandTotal)}</span>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!loading && totals.length === 0 && <p className="text-sm text-slate-500">No spending recorded yet.</p>}

      <ul className="space-y-2">
        {totals.map((t) => (
          <li key={t.category} className="text-sm">
            <div className="flex justify-between">
              <span className="capitalize">{t.category}</span>
              <span>{formatMoney(t.total)}</span>
            </div>
            <div className="mt-1 h-2 rounded bg-slate-100">
              <div className="h-2 rounded bg-indigo-500" style={{ width: `${(t.total / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
