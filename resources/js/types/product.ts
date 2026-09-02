import type { Category } from './category';

export type ProductAvailabilityStatus = 'in_stock' | 'made_to_order' | 'unavailable';

export interface ProductVariant {
    id: number;
    name: string;
    price_modifier: number;
    is_default: boolean;
}

export interface ProductImage {
    id: number;
    url: string;
    sort_order: number;
}

export interface Product {
    id: number;
    name: string;
    description: string | null;
    base_price: number;
    preparation_time_hours: number | null;
    availability_status: ProductAvailabilityStatus;
    is_active: boolean;
    categories: Category[];
    variants: ProductVariant[];
    images: ProductImage[];
}
