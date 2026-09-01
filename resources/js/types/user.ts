export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
}
