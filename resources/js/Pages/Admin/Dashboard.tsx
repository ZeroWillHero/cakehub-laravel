import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    metrics: {
        customers: number;
        sellers: number;
        orders: number;
        pending_verifications: number;
    };
}

export default function AdminDashboard({ metrics }: Props) {
    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Admin</h1>
                    <div className="flex gap-4 text-sm">
                        <Link href="/admin/sellers/pending" className="text-primary underline">
                            Verification queue
                        </Link>
                        <Link href="/admin/categories" className="text-primary underline">
                            Categories
                        </Link>
                        <Link href="/admin/subscription-plans" className="text-primary underline">
                            Subscription plans
                        </Link>
                        <Link href="/admin/bank-accounts" className="text-primary underline">
                            Bank accounts
                        </Link>
                        <Link href="/admin/payment-verifications" className="text-primary underline">
                            Payment verifications
                        </Link>
                        <Link href="/admin/seller-payouts" className="text-primary underline">
                            Seller payouts
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
            </div>
        </div>
    );
}
