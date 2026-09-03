import type { SellerDocument } from './sellerDocument';

export type StoreStatus = 'open' | 'closed' | 'vacation';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface Seller {
    id: number;
    business_name: string;
    slug: string;
    description: string | null;
    logo_path: string | null;
    cover_path: string | null;
    whatsapp_number: string;
    address_line: string | null;
    latitude: number | null;
    longitude: number | null;
    operating_hours: Record<string, unknown> | null;
    store_status: StoreStatus;
    verification_status: VerificationStatus;
    average_rating: number;
    created_at?: string | null;
    payout_bank_name?: string | null;
    payout_account_name?: string | null;
    payout_account_number?: string | null;
    /** Present only in "nearby" search results. */
    distance_km?: number;
    documents?: SellerDocument[];
    user?: {
        id: number;
        name: string;
        email: string;
    };
}
