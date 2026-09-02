import type { SubscriptionPlan } from './subscriptionPlan';

export type SellerSubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface SellerSubscription {
    id: number;
    status: SellerSubscriptionStatus;
    starts_at: string | null;
    ends_at: string | null;
    plan?: SubscriptionPlan;
}
