import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ListingUsageIndicator from '@/components/shared/ListingUsageIndicator';
import { api } from '@/lib/api';
import type { SellerSubscription } from '@/types/sellerSubscription';
import type { SubscriptionPlan } from '@/types/subscriptionPlan';

interface Props {
    plans: SubscriptionPlan[];
    currentSubscription: SellerSubscription | null;
    history: SellerSubscription[];
    usage: number;
    limit: number | null;
}

function billingLabel(plan: SubscriptionPlan): string {
    if (plan.price === 0) return 'Free';
    return plan.billing_cycle === 'annual' ? `$${plan.price}/yr` : `$${plan.price}/mo`;
}

export default function SellerSubscriptionPage({
    plans,
    currentSubscription: initialSubscription,
    history,
    usage,
    limit: initialLimit,
}: Props) {
    const [currentSubscription, setCurrentSubscription] = useState(initialSubscription);
    const [limit, setLimit] = useState(initialLimit);
    const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null);
    const [busy, setBusy] = useState(false);

    async function subscribe() {
        if (!confirmPlan) return;
        setBusy(true);
        try {
            const subscription = await api.post<SellerSubscription>('/seller/subscription/checkout', {
                subscription_plan_id: confirmPlan.id,
            });
            setCurrentSubscription(subscription);
            setLimit(confirmPlan.listing_limit);
            setConfirmPlan(null);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-semibold">Subscription</h1>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Current plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">{currentSubscription?.plan?.name ?? 'Free'}</span>
                            {currentSubscription?.ends_at && (
                                <span className="text-sm text-muted-foreground">
                                    Renews {new Date(currentSubscription.ends_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <ListingUsageIndicator usage={usage} limit={limit} />
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-lg font-semibold">Available plans</h2>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {plans.map((plan) => {
                            const isCurrent = currentSubscription?.plan?.id === plan.id;
                            return (
                                <Card key={plan.id} className={isCurrent ? 'border-primary' : undefined}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">{plan.name}</CardTitle>
                                            {isCurrent && <Badge>Current</Badge>}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-2xl font-semibold">{billingLabel(plan)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {plan.listing_limit === null
                                                ? 'Unlimited listings'
                                                : `Up to ${plan.listing_limit} listings`}
                                        </p>
                                        <Button
                                            type="button"
                                            className="w-full"
                                            variant={isCurrent ? 'outline' : 'default'}
                                            disabled={isCurrent || busy}
                                            onClick={() => setConfirmPlan(plan)}
                                        >
                                            {isCurrent ? 'Current plan' : 'Switch to this plan'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {history.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold">Billing history</h2>
                        <div className="mt-3 divide-y rounded-lg border">
                            {history.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                    <span>{sub.plan?.name}</span>
                                    <span className="text-muted-foreground">
                                        {sub.starts_at && new Date(sub.starts_at).toLocaleDateString()}
                                    </span>
                                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                        {sub.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <AlertDialog open={confirmPlan !== null} onOpenChange={(open) => !open && setConfirmPlan(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Switch to {confirmPlan?.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {confirmPlan && confirmPlan.listing_limit !== null && limit !== null && confirmPlan.listing_limit < limit
                                    ? "This plan's listing limit is lower than your current one. If you're over the new limit, your most recent listings will be hidden (not deleted) until you're back under it."
                                    : 'Payment is stubbed for now — no real charge will be made.'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={subscribe}>Confirm</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
