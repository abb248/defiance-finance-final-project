import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utilsz";

const getPageUrl = (page: number, query?: PaginationProps["query"]) => {
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  params.set("page", String(page));

  return `/transaction-history?${params.toString()}`;
};

const Pagination = ({ page, totalPages, query }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      className="pagination"
      aria-label="Transaction history pagination"
    >
      <Link
        href={hasPrevious ? getPageUrl(page - 1, query) : "#"}
        aria-disabled={!hasPrevious}
        className={cn("pagination-btn", {
          "pointer-events-none opacity-50": !hasPrevious,
        })}
      >
        <ChevronLeft className="size-4" />
        <span>Previous</span>
      </Link>

      <div className="pagination-pages">
        {pages.map((pageNumber) => (
          <Link
            key={pageNumber}
            href={getPageUrl(pageNumber, query)}
            aria-current={pageNumber === page ? "page" : undefined}
            className={cn("pagination-page", {
              "border-blue-600 bg-blue-600 text-white": pageNumber === page,
              "border-gray-200 bg-white text-gray-700": pageNumber !== page,
            })}
          >
            {pageNumber}
          </Link>
        ))}
      </div>

      <Link
        href={hasNext ? getPageUrl(page + 1, query) : "#"}
        aria-disabled={!hasNext}
        className={cn("pagination-btn", {
          "pointer-events-none opacity-50": !hasNext,
        })}
      >
        <span>Next</span>
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
};

export default Pagination;
