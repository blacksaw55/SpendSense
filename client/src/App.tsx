import { CategorySummary } from "./components/CategorySummary";
import { DraftReview } from "./components/DraftReview";
import { ExpenseList } from "./components/ExpenseList";
import { Filters } from "./components/Filters";
import { QuickAdd } from "./components/QuickAdd";

export default function App() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">SpendSense</h1>
        <p className="text-slate-500">Track spending in plain English.</p>
      </header>

      <div className="space-y-4">
        <QuickAdd />
        <DraftReview />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 md:col-span-2">
            <Filters />
            <ExpenseList />
          </div>
          <CategorySummary />
        </div>
      </div>
    </div>
  );
}
