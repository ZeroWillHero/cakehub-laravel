export interface CartItem {
    id: number;
    product_id: number;
    product_name: string;
    product_variant_id: number | null;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    customization_notes: string | null;
    seller: {
        id: number;
        business_name: string;
        slug: string;
    };
}
