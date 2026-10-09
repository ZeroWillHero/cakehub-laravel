import { Link, router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
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

const statCards: { label: string; metric: keyof Props['metrics']; href: string }[] = [
    { label: 'Customers', metric: 'customers', href: '/admin/users?tab=customers' },
    { label: 'Sellers', metric: 'sellers', href: '/admin/users?tab=sellers' },
    { label: 'Orders', metric: 'orders', href: '/admin/orders' },
    { label: 'Pending verifications', metric: 'pending_verifications', href: '/admin/sellers/pending' },
];

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
                {statCards.map((stat) => (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <Card className="h-full transition-shadow group-hover:shadow-md group-hover:ring-foreground/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-end justify-between gap-2">
                                <span className="text-2xl font-semibold">{metrics[stat.metric]}</span>
                                <span className="flex items-center gap-0.5 text-xs text-muted-foreground group-hover:text-foreground">
                                    View all
                                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
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
