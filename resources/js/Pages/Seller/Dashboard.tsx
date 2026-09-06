import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ListingUsageIndicator from '@/components/shared/ListingUsageIndicator';
import NotificationBell from '@/components/shared/NotificationBell';
import type { Seller } from '@/types/seller';

interface Props {
    seller: Seller;
    usage: number;
    limit: number | null;
}

const verificationLabel: Record<Seller['verification_status'], string> = {
    pending: 'Pending verification',
    verified: 'Verified',
    rejected: 'Rejected',
    suspended: 'Suspended',
};

export default function SellerDashboard({ seller, usage, limit }: Props) {
    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold">{seller.business_name}</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant={seller.verification_status === 'verified' ? 'default' : 'secondary'}>
                            {verificationLabel[seller.verification_status]}
                        </Badge>
                        <a href="/seller/reviews" className="text-sm text-primary underline">
                            Reviews
                        </a>
                        <NotificationBell />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Listings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ListingUsageIndicator usage={usage} limit={limit} />
                        <a href="/seller/listings" className="text-sm text-primary underline">
                            Manage listings
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a href="/seller/orders" className="text-sm text-primary underline">
                            View orders
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Subscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a href="/seller/subscription" className="text-sm text-primary underline">
                            Manage subscription
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Payouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a href="/seller/payouts" className="text-sm text-primary underline">
                            View payouts
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Getting started</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Finish your{' '}
                        <a href="/seller/profile" className="text-primary underline">
                            store profile
                        </a>{' '}
                        to get set up.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
