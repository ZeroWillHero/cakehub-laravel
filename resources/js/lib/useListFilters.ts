import { router } from '@inertiajs/react';
import { useState } from 'react';

type FilterValue = string | number | null | undefined;

/**
 * Admin list pages keep their filters in the URL query string (so a
 * filtered view can be bookmarked and Back works). `current` is the
 * filter set the server echoed back for this render; every change does a
 * partial Inertia reload of just `only`.
 */
export function useListFilters<F extends Record<string, FilterValue>>(current: F, only: string[]) {
    const [loading, setLoading] = useState(false);

    function query(next: Partial<F>, page?: number): Record<string, string> {
        const merged: Record<string, FilterValue> = { ...current, ...next, page: page && page > 1 ? page : undefined };
        return Object.fromEntries(
            Object.entries(merged)
                .filter(([, value]) => value !== null && value !== undefined && value !== '')
                .map(([key, value]) => [key, String(value)]),
        );
    }

    function visit(data: Record<string, string>) {
        router.get(window.location.pathname, data, {
            only,
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    }

    return {
        loading,
        /** Change filters — always back to page 1, since the result set changed. */
        setFilters: (next: Partial<F>) => visit(query(next)),
        setPage: (page: number) => visit(query({}, page)),
        pageHref: (page: number) => `${window.location.pathname}?${new URLSearchParams(query({}, page)).toString()}`,
        clear: (keep: Partial<F> = {}) => {
            const cleared = Object.fromEntries(Object.keys(current).map((key) => [key, null])) as Partial<F>;
            visit(query({ ...cleared, ...keep }));
        },
    };
}
