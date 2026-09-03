import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import OrdersLineChart from '@/components/shared/OrdersLineChart';
import StatusBreakdownChart from '@/components/shared/StatusBreakdownChart';
import type { OrderStatus } from '@/types/order';

interface Props {
    metrics: {
        customers: number;
        sellers: number;
        orders: number;
        pending_verifications: number;
    };
    analytics: {
        ordersOverTime: { date: string; count: number }[];
        newSellersOverTime: { date: string; count: number }[];
        statusBreakdown: Record<OrderStatus, number>;
    };
}

const statusLabel: Record<OrderStatus, string> = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

export default function AdminDashboard({ metrics, analytics }: Props) {
    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold">Admin</h1>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <Link href="/admin/sellers/pending" className="text-primary underline">
                            Verification queue
                        </Link>
                        <Link href="/admin/categories" className="text-primary underline">
                            Categories
                        </Link>
                        <Link href="/admin/subscription-plans" className="text-primary underline">
                            Subscription plans
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{metrics.customers}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Sellers</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{metrics.sellers}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{metrics.orders}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending verifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{metrics.pending_verifications}</CardContent>
                    </Card>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Platform activity — last 30 days</h2>
                    <a href="/admin/dashboard/export" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        Export CSV
                    </a>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OrdersLineChart series={[{ data: analytics.ordersOverTime, label: 'Orders' }]} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">New sellers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OrdersLineChart
                                series={[
                                    {
                                        data: analytics.newSellersOverTime,
                                        label: 'New sellers',
                                        color: 'var(--chart-2)',
                                    },
                                ]}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Order status breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatusBreakdownChart breakdown={analytics.statusBreakdown} labels={statusLabel} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
