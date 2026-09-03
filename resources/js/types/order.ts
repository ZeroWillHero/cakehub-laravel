import type { Address } from './address';

export type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
export type DeliveryType = 'delivery' | 'pickup';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
    id: number;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    customization_notes: string | null;
}

export interface Order {
    id: number;
    status: OrderStatus;
    allowed_next_statuses: OrderStatus[];
    delivery_type: DeliveryType;
    delivery_address: Address | null;
    scheduled_at: string;
    subtotal: number;
    delivery_fee: number;
    total: number;
    payment_status: PaymentStatus;
    cancelled_reason: string | null;
    created_at: string;
    seller?: {
        id: number;
        business_name: string;
        slug: string;
        whatsapp_number: string;
    };
    customer?: {
        id: number;
        name: string;
    };
    items: OrderItem[];
    review?: Review | null;
}

export interface Review {
    id: number;
    order_id: number;
    rating: number;
    comment: string | null;
    seller_response: string | null;
    created_at: string;
    customer?: {
        id: number;
        name: string;
        avatar_url: string | null;
    };
    seller?: {
        id: number;
        business_name: string;
    };
}
