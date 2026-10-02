export interface SharedAuthUser {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    /** Null until the user picks a role during onboarding. */
    role: 'customer' | 'seller' | 'admin' | null;
}

export interface SharedPageProps {
    auth: {
        user: SharedAuthUser | null;
    };
    [key: string]: unknown;
}
