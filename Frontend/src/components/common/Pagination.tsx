type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const to = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <p className="text-xs font-semibold text-muted">
        {from && to && totalItems
          ? `Showing ${from}-${to} of ${totalItems}`
          : `Page ${currentPage} of ${totalPages}`}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-full border border-sand px-3 py-1.5 text-xs font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>

        {start > 1 ? (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="h-8 w-8 rounded-full border border-sand text-xs font-semibold text-ink"
            >
              1
            </button>
            {start > 2 ? <span className="px-1 text-xs text-muted">...</span> : null}
          </>
        ) : null}

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
              page === currentPage
                ? "bg-brown text-white"
                : "border border-sand text-ink hover:bg-warm"
            }`}
          >
            {page}
          </button>
        ))}

        {end < totalPages ? (
          <>
            {end < totalPages - 1 ? <span className="px-1 text-xs text-muted">...</span> : null}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="h-8 w-8 rounded-full border border-sand text-xs font-semibold text-ink"
            >
              {totalPages}
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-full border border-sand px-3 py-1.5 text-xs font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
