import { useAppDispatch, useAppSelector } from "../app/store";
import { categoryChanged, monthChanged } from "../features/expenses/expensesSlice";
import { CATEGORIES, type Category } from "../graphql/operations";

export function Filters() {
  const dispatch = useAppDispatch();
  const { month, category } = useAppSelector((state) => state.expenses);

  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="month"
        value={month}
        onChange={(e) => dispatch(monthChanged(e.target.value))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        aria-label="Month"
      />
      <select
        value={category ?? ""}
        onChange={(e) => dispatch(categoryChanged((e.target.value || null) as Category | null))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        aria-label="Category"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
