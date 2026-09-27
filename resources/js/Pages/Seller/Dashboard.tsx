import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SellerLayout from '@/Layouts/SellerLayout';
import ListingUsageIndicator from '@/components/shared/ListingUsageIndicator';
import OrdersAreaChart, { type ChartRange } from '@/components/shared/OrdersAreaChart';
import StatusBreakdownChart from '@/components/shared/StatusBreakdownChart';
import type { Order, OrderStatus } from '@/types/order';
import type { Seller } from '@/types/seller';

interface Analytics {
    range: ChartRange;
    ordersOverTime: { date: string; count: number }[];
    statusBreakdown: Record<OrderStatus, number>;
    orderValueTotal: number;
}

interface Props {
    seller: Seller;
    usage: number;
    limit: number | null;
    hasAnalyticsAccess: boolean;
    recentOrders: Order[];
    analytics: Analytics | null;
}

const verificationLabel: Record<Seller['verification_status'], string> = {
    pending: 'Pending verification',
    verified: 'Verified',
    rejected: 'Rejected',
    suspended: 'Suspended',
};

const statusLabel: Record<OrderStatus, string> = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

export default function SellerDashboard({
    seller,
    usage,
    limit,
    hasAnalyticsAccess,
    recentOrders,
    analytics,
}: Props) {
    const [loadingRange, setLoadingRange] = useState(false);

    function setRange(range: ChartRange) {
        router.reload({
            data: { range },
            only: ['analytics'],
            onStart: () => setLoadingRange(true),
            onFinish: () => setLoadingRange(false),
        });
    }

    return (
        <SellerLayout breadcrumb={['Dashboard']}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">{seller.business_name}</h1>
                <Badge variant={seller.verification_status === 'verified' ? 'default' : 'secondary'}>
                    {verificationLabel[seller.verification_status]}
                </Badge>
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
                        <CardTitle className="text-base">Recent orders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No orders yet.</p>
                        ) : (
                            <ul className="divide-y">
                                {recentOrders.map((order) => (
                                    <li key={order.id} className="flex items-center justify-between py-2 text-sm">
                                        <span>
                                            Order #{order.id} — {order.customer?.name}
                                        </span>
                                        <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                            {statusLabel[order.status]}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <a href="/seller/orders" className="text-sm text-primary underline">
                            View all orders
                        </a>
                    </CardContent>
                </Card>

                {hasAnalyticsAccess && analytics ? (
                    <>
                        <OrdersAreaChart
                            title="Orders"
                            data={analytics.ordersOverTime}
                            range={analytics.range}
                            onRangeChange={setRange}
                            loading={loadingRange}
                        />

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Order status breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <StatusBreakdownChart breakdown={analytics.statusBreakdown} labels={statusLabel} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Completed order value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold">${analytics.orderValueTotal.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">
                                    Total value of completed orders — sellers collect payment directly, this isn't
                                    platform-settled revenue.
                                </p>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sales analytics</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Order charts and trends are available on the Pro plan and above.{' '}
                            <a href="/seller/subscription" className="text-primary underline">
                                Upgrade your plan
                            </a>
                            .
                        </CardContent>
                    </Card>
                )}

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
        </SellerLayout>
    );
}
