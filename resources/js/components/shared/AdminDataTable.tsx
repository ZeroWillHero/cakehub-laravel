import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/types/pagination';

export interface AdminColumn<T> {
    key: string;
    header: string;
    cell: (row: T) => ReactNode;
    /** e.g. `hidden md:table-cell` for low-priority columns, `text-right` for numbers. */
    className?: string;
}

interface Props<T> {
    rows: T[];
    columns: AdminColumn<T>[];
    meta: PaginationMeta;
    rowKey: (row: T) => number | string;
    /** Accessible name for a row, read out when it's focused (e.g. "Order #130"). */
    rowLabel: (row: T) => string;
    onRowClick: (row: T) => void;
    search: string;
    searchPlaceholder: string;
    onSearch: (value: string) => void;
    /** Filter controls rendered next to the search box. */
    filters?: ReactNode;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    onPageChange: (page: number) => void;
    pageHref: (page: number) => string;
    loading?: boolean;
    /** Shown when nothing exists at all (as opposed to nothing matching the filters). */
    emptyMessage: string;
}

const SEARCH_DEBOUNCE_MS = 300;

/** First, last, current ±1, with ellipses between gaps: 1 … 4 5 6 … 12 */
export function pageWindow(current: number, last: number): (number | 'gap')[] {
    const pages = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
    const sorted = [...pages].sort((a, b) => a - b);
    return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1] > 1 ? ['gap' as const, page] : [page]));
}

/**
 * Shared list shell for the admin Orders/Users pages (docs/screens.md A6/A8):
 * search + filters toolbar, a keyboard-operable table whose rows open a
 * detail sheet, and a server-side pager.
 */
export default function AdminDataTable<T>({
    rows,
    columns,
    meta,
    rowKey,
    rowLabel,
    onRowClick,
    search,
    searchPlaceholder,
    onSearch,
    filters,
    hasActiveFilters,
    onClearFilters,
    onPageChange,
    pageHref,
    loading = false,
    emptyMessage,
}: Props<T>) {
    const [searchInput, setSearchInput] = useState(search);
    const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
    const lastSent = useRef(search);

    // Resync the box only when the server-side value changes for some other
    // reason ("Clear filters", Back/Forward) — not when it's just echoing
    // back what was typed, or it would wipe keystrokes typed meanwhile.
    useEffect(() => {
        if (search !== lastSent.current) {
            lastSent.current = search;
            setSearchInput(search);
        }
    }, [search]);
    useEffect(() => () => clearTimeout(debounce.current), []);

    function handleSearchChange(value: string) {
        setSearchInput(value);
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
            lastSent.current = value.trim();
            onSearch(value.trim());
        }, SEARCH_DEBOUNCE_MS);
    }

    function goTo(event: React.MouseEvent, page: number) {
        event.preventDefault();
        if (page >= 1 && page <= meta.last_page && page !== meta.current_page) onPageChange(page);
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
                <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        className="pl-8"
                    />
                </div>
                {filters}
                {hasActiveFilters && (
                    <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
                        Clear filters
                    </Button>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border" aria-busy={loading}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={column.key} className={column.className}>
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading
                            ? Array.from({ length: Math.min(Math.max(rows.length, 3), 8) }, (_, i) => (
                                  <TableRow key={`loading-${i}`}>
                                      {columns.map((column) => (
                                          <TableCell key={column.key} className={column.className}>
                                              <Skeleton className="h-4 w-full max-w-32" />
                                          </TableCell>
                                      ))}
                                  </TableRow>
                              ))
                            : rows.map((row) => (
                                  <TableRow
                                      key={rowKey(row)}
                                      tabIndex={0}
                                      aria-label={rowLabel(row)}
                                      onClick={() => onRowClick(row)}
                                      onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              onRowClick(row);
                                          }
                                      }}
                                      className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                                  >
                                      {columns.map((column) => (
                                          <TableCell key={column.key} className={column.className}>
                                              {column.cell(row)}
                                          </TableCell>
                                      ))}
                                  </TableRow>
                              ))}
                        {!loading && rows.length === 0 && (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                                    {meta.total > 0 ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <span>There&apos;s nothing on this page.</span>
                                            <Button type="button" variant="outline" size="sm" onClick={() => onPageChange(1)}>
                                                Go to the first page
                                            </Button>
                                        </div>
                                    ) : hasActiveFilters ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <span>No results match your filters.</span>
                                            <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
                                                Clear filters
                                            </Button>
                                        </div>
                                    ) : (
                                        emptyMessage
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {meta.total > 0 && (
                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                    <p className="text-sm text-muted-foreground" aria-live="polite">
                        {meta.from !== null ? `Showing ${meta.from}–${meta.to} of ${meta.total}` : `${meta.total} in total`}
                    </p>
                    {meta.last_page > 1 && (
                        <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={pageHref(meta.current_page - 1)}
                                        onClick={(e) => goTo(e, meta.current_page - 1)}
                                        aria-disabled={meta.current_page === 1}
                                        className={cn(meta.current_page === 1 && 'pointer-events-none opacity-50')}
                                    />
                                </PaginationItem>
                                {pageWindow(meta.current_page, meta.last_page).map((page, i) =>
                                    page === 'gap' ? (
                                        <PaginationItem key={`gap-${i}`}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    ) : (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href={pageHref(page)}
                                                isActive={page === meta.current_page}
                                                onClick={(e) => goTo(e, page)}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ),
                                )}
                                <PaginationItem>
                                    <PaginationNext
                                        href={pageHref(meta.current_page + 1)}
                                        onClick={(e) => goTo(e, meta.current_page + 1)}
                                        aria-disabled={meta.current_page === meta.last_page}
                                        className={cn(meta.current_page === meta.last_page && 'pointer-events-none opacity-50')}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            )}
        </div>
    );
}
