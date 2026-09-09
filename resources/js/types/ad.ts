export type AdStatus = 'draft' | 'active' | 'paused';

export interface Ad {
    id: number;
    name: string;
    description: string | null;
    image_path: string | null;
    link_url: string | null;
    paid_amount: number;
    status: AdStatus;
    starts_at: string;
    ends_at: string;
    sort_order: number;
    created_by: number | null;
    is_currently_visible: boolean;
}

export interface AdSetting {
    rotation_seconds: number;
}
