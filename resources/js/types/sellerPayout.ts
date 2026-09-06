export type SellerPayoutStatus = 'pending' | 'paid' | 'confirmed';

export interface SellerPayout {
    id: number;
    order_id: number;
    amount: number;
    status: SellerPayoutStatus;
    has_slip: boolean;
    paid_at: string | null;
    confirmed_at: string | null;
    seller?: {
        id: number;
        business_name: string;
    };
    order?: {
        id: number;
        total: number;
    };
    created_at: string;
}
