export interface Category {
    id: number;
    name: string;
    slug: string;
    image_path: string | null;
    image_url: string | null;
    parent_id: number | null;
    sort_order: number;
    is_active: boolean;
    created_by: number | null;
}
