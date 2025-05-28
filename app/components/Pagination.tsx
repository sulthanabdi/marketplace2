'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParamsList = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParamsList.toString());
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - 1 && page <= currentPage + 1)
  );

  return (
    <nav className="flex justify-center">
      <ul className="flex space-x-2">
        {currentPage > 1 && (
          <li>
            <Link
              href={createPageUrl(currentPage - 1)}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              Previous
            </Link>
          </li>
        )}

        {visiblePages.map((page, index) => {
          const showEllipsis =
            index > 0 && page - visiblePages[index - 1] > 1;

          return (
            <li key={page}>
              {showEllipsis && (
                <span className="px-3 py-2 text-sm font-medium text-gray-500">
                  ...
                </span>
              )}
              <Link
                href={createPageUrl(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </Link>
            </li>
          );
        })}

        {currentPage < totalPages && (
          <li>
            <Link
              href={createPageUrl(currentPage + 1)}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              Next
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
} 