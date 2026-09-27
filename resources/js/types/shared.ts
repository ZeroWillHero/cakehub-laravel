export interface SharedAuthUser {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
}

export interface SharedPageProps {
    auth: {
        user: SharedAuthUser | null;
    };
    [key: string]: unknown;
}
