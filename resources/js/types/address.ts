export interface Address {
    id: number;
    label: string | null;
    line1: string;
    line2: string | null;
    city: string;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    is_default: boolean;
}
