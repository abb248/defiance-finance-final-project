import Link from "next/link";

type TransactionFiltersProps = {
  categories: string[];
  query: TransactionFilterQuery;
  selectedAccountId?: string;
  totalCount: number;
  filteredCount: number;
};

const cleanValue = (value?: string) => value || "";

const TransactionFilters = ({
  categories,
  query,
  selectedAccountId,
  totalCount,
  filteredCount,
}: TransactionFiltersProps) => (
  <form className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <input type="hidden" name="id" value={selectedAccountId || ""} />

    <div className="mb-4 flex flex-col gap-1">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="text-18 font-semibold text-gray-900">Filters</h2>
        <p className="text-13 font-medium text-gray-600">
          Showing {filteredCount} of {totalCount} transactions
        </p>
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <div className="xl:col-span-2">
        <label className="mb-1 block text-12 font-semibold text-gray-600">
          Search
        </label>
        <input
          name="search"
          defaultValue={cleanValue(query.search)}
          placeholder="Name, channel, category"
          className="input-class h-11 w-full px-3 text-14"
        />
      </div>

      <div>
        <label className="mb-1 block text-12 font-semibold text-gray-600">
          Category
        </label>
        <select
          name="category"
          defaultValue={cleanValue(query.category)}
          className="input-class h-11 w-full px-3 text-14"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-12 font-semibold text-gray-600">
          Type
        </label>
        <select
          name="type"
          defaultValue={cleanValue(query.type)}
          className="input-class h-11 w-full px-3 text-14"
        >
          <option value="">All types</option>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-12 font-semibold text-gray-600">
          From
        </label>
        <input
          type="date"
          name="from"
          defaultValue={cleanValue(query.from)}
          className="input-class h-11 w-full px-3 text-14"
        />
      </div>

      <div>
        <label className="mb-1 block text-12 font-semibold text-gray-600">
          To
        </label>
        <input
          type="date"
          name="to"
          defaultValue={cleanValue(query.to)}
          className="input-class h-11 w-full px-3 text-14"
        />
      </div>

      <div>
        <label className="mb-1 block text-12 font-semibold text-gray-600">
          Min amount
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          name="min"
          defaultValue={cleanValue(query.min)}
          placeholder="0"
          className="input-class h-11 w-full px-3 text-14"
        />
      </div>

      <div>
        <label className="mb-1 block text-12 font-semibold text-gray-600">
          Max amount
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          name="max"
          defaultValue={cleanValue(query.max)}
          placeholder="Any"
          className="input-class h-11 w-full px-3 text-14"
        />
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Link
        href={
          selectedAccountId
            ? `/transaction-history?id=${selectedAccountId}`
            : "/transaction-history"
        }
        className="flex-center rounded-lg border border-gray-200 px-4 py-2.5 text-14 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
      >
        Clear
      </Link>
      <button
        type="submit"
        className="rounded-lg bg-bank-gradient px-4 py-2.5 text-14 font-semibold text-white shadow-form"
      >
        Apply filters
      </button>
    </div>
  </form>
);

export default TransactionFilters;
