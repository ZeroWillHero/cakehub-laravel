/** Mirrors App\Support\PaginationMeta. */
export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    /** 1-based index of the first row on this page; null when the page is empty. */
    from: number | null;
    to: number | null;
}

export interface Paginated<T> {
    data: T[];
    meta: PaginationMeta;
}
