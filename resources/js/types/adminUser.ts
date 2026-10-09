import type { VerificationStatus } from './seller';

export type UserStatus = 'active' | 'suspended' | 'deactivated';

/** Mirrors App\Http\Resources\Admin\AdminUserResource. */
export interface AdminUser {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    role: 'customer' | 'seller';
    status: UserStatus;
    created_at: string;
    /** Customer rows only. */
    orders_count?: number;
    orders_total?: number;
    last_order_at?: string | null;
    /** Seller rows only; null if the seller never finished onboarding. */
    seller?: {
        id: number;
        business_name: string;
        slug: string;
        verification_status: VerificationStatus;
        products_count: number;
        orders_count: number;
    } | null;
}
