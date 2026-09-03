export interface Category {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    sort_order: number;
    is_active: boolean;
    created_by: number | null;
}
