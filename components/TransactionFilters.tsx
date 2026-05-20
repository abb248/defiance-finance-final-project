import Link from "next/link";

type TransactionFiltersProps = {
  categories: string[];
  statuses: string[];
  channels: string[];
  query: TransactionFilterQuery;
  selectedAccountId?: string;
  totalCount: number;
  filteredCount: number;
};

const cleanValue = (value?: string) => value || "";

const formatInputDate = (date: Date) => date.toISOString().slice(0, 10);

const getQuickDates = () => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);

  return {
    today: formatInputDate(today),
    monthStart: formatInputDate(monthStart),
    last30Days: formatInputDate(last30Days),
  };
};

const getFilterUrl = (
  selectedAccountId: string | undefined,
  currentQuery: TransactionFilterQuery,
  updates: TransactionFilterQuery
) => {
  const params = new URLSearchParams();
  const merged = {
    ...currentQuery,
    ...updates,
    id: selectedAccountId || currentQuery.id,
  };

  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  params.delete("page");

  return `/transaction-history?${params.toString()}`;
};

const getActiveFilterCount = (query: TransactionFilterQuery) =>
  [
    query.search,
    query.category,
    query.status,
    query.channel,
    query.type,
    query.from,
    query.to,
    query.min,
    query.max,
    query.sort && query.sort !== "newest" ? query.sort : "",
  ].filter(Boolean).length;

const TransactionFilters = ({
  categories,
  statuses,
  channels,
  query,
  selectedAccountId,
  totalCount,
  filteredCount,
}: TransactionFiltersProps) => {
  const dates = getQuickDates();
  const activeFilterCount = getActiveFilterCount(query);
  const quickFilters = [
    {
      label: "This month",
      href: getFilterUrl(selectedAccountId, query, {
        from: dates.monthStart,
        to: dates.today,
      }),
    },
    {
      label: "Last 30 days",
      href: getFilterUrl(selectedAccountId, query, {
        from: dates.last30Days,
        to: dates.today,
      }),
    },
    {
      label: "Expenses",
      href: getFilterUrl(selectedAccountId, query, {
        type: "debit",
        min: "",
        max: "",
        sort: "",
      }),
    },
    {
      label: "Income",
      href: getFilterUrl(selectedAccountId, query, {
        type: "credit",
        min: "",
        max: "",
        sort: "",
      }),
    },
    {
      label: "High spending",
      href: getFilterUrl(selectedAccountId, query, {
        type: "debit",
        min: "100",
        max: "",
        sort: "amount-desc",
      }),
    },
  ];

  return (
    <form className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="id" value={selectedAccountId || ""} />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-18 font-semibold text-gray-900">
              Smart search
            </h2>
            <p className="text-13 text-gray-600">
              Search by merchant, account, category, channel, date, or amount.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-13 font-medium text-gray-700">
            Showing {filteredCount} of {totalCount}
            {activeFilterCount ? ` - ${activeFilterCount} filters` : ""}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Link
              key={filter.label}
              href={filter.href}
              className="rounded-full border border-gray-200 bg-white px-3 py-2 text-13 font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-25 hover:text-blue-700"
            >
              {filter.label}
            </Link>
          ))}
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
            placeholder="Merchant, account, channel"
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
            <option value="debit">Expense</option>
            <option value="credit">Income</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-12 font-semibold text-gray-600">
            Status
          </label>
          <select
            name="status"
            defaultValue={cleanValue(query.status)}
            className="input-class h-11 w-full px-3 text-14"
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-12 font-semibold text-gray-600">
            Channel
          </label>
          <select
            name="channel"
            defaultValue={cleanValue(query.channel)}
            className="input-class h-11 w-full px-3 text-14"
          >
            <option value="">All channels</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
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

        <div>
          <label className="mb-1 block text-12 font-semibold text-gray-600">
            Sort
          </label>
          <select
            name="sort"
            defaultValue={cleanValue(query.sort) || "newest"}
            className="input-class h-11 w-full px-3 text-14"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
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
};

export default TransactionFilters;
