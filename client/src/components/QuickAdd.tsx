import { useMutation } from "@apollo/client/react";
import { useRef, useState, type FormEvent } from "react";
import { useAppDispatch } from "../app/store";
import { draftCreated } from "../features/expenses/expensesSlice";
import { PARSE_EXPENSE_TEXT, PARSE_RECEIPT } from "../graphql/operations";
import { fileToBase64, localToday } from "../utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** AI entry point: type a sentence or upload a receipt, get a draft to review. */
export function QuickAdd() {
  const dispatch = useAppDispatch();
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [parseText, textResult] = useMutation(PARSE_EXPENSE_TEXT);
  const [parseReceipt, receiptResult] = useMutation(PARSE_RECEIPT);
  const loading = textResult.loading || receiptResult.loading;
  const error = fileError ?? textResult.error?.message ?? receiptResult.error?.message;

  async function handleText(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    const { data } = await parseText({ variables: { text, today: localToday() } }).catch(() => ({ data: undefined }));
    if (data) {
      dispatch(draftCreated({ ...data.parseExpenseText, source: "text" }));
      setText("");
    }
  }

  async function handleFile(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError("Image is larger than 5 MB. Please use a smaller photo.");
      return;
    }
    const imageBase64 = await fileToBase64(file);
    const { data } = await parseReceipt({
      variables: { imageBase64, mediaType: file.type, today: localToday() },
    }).catch(() => ({ data: undefined }));
    if (data) dispatch(draftCreated({ ...data.parseReceipt, source: "receipt" }));
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 font-semibold">Add an expense</h2>
      <p className="mb-3 text-sm text-slate-500">Describe it in plain English or upload a receipt photo.</p>

      <form onSubmit={handleText} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="e.g. paid 450 for Swiggy dinner yesterday"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {textResult.loading ? "Reading…" : "Add with AI"}
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium disabled:opacity-50"
        >
          {receiptResult.loading ? "Scanning…" : "Scan receipt"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
