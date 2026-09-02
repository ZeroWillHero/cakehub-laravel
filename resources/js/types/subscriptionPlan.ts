export type BillingCycle = 'monthly' | 'annual' | null;

export interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;
    billing_cycle: BillingCycle;
    listing_limit: number | null;
    features: Record<string, unknown> | unknown[];
    is_active: boolean;
    sort_order: number;
}
