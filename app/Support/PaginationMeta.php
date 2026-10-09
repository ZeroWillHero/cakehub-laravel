<?php

namespace App\Support;

use Illuminate\Pagination\LengthAwarePaginator;

/**
 * The `meta` block the admin list pages render their pager from — the same
 * fields as Laravel's paginator JSON, minus the link URLs (the frontend
 * rebuilds those from the current filters).
 */
class PaginationMeta
{
    /**
     * @return array{current_page: int, last_page: int, per_page: int, total: int, from: int|null, to: int|null}
     */
    public static function from(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
