import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import AdminLayout from '@/Layouts/AdminLayout';
import OrdersAreaChart, { type ChartRange } from '@/components/shared/OrdersAreaChart';
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
        range: ChartRange;
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
        <AdminLayout breadcrumb={['Dashboard']}>
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
                <h2 className="text-lg font-semibold">Platform activity</h2>
                <a href="/admin/dashboard/export" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    Export CSV
                </a>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <OrdersAreaChart
                    title="Orders"
                    data={analytics.ordersOverTime}
                    range={analytics.range}
                    onRangeChange={setRange}
                    loading={loadingRange}
                />
                <OrdersAreaChart
                    title="New sellers"
                    data={analytics.newSellersOverTime}
                    range={analytics.range}
                    onRangeChange={setRange}
                    color="var(--chart-2)"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Order status breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatusBreakdownChart breakdown={analytics.statusBreakdown} labels={statusLabel} />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
