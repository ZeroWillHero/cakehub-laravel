export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deactivated';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
}

export interface NotificationPreferences {
    order_status?: { email: boolean };
    seller_verification?: { email: boolean };
    subscription_status?: { email: boolean };
}
