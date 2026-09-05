import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import CustomerLayout from '@/Layouts/CustomerLayout';
import PageHero from '@/components/shared/PageHero';
import Section from '@/components/shared/Section';
import type { Order, OrderStatus } from '@/types/order';

interface Props {
    orders: Order[];
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

export default function OrderHistory({ orders }: Props) {
    return (
        <CustomerLayout>
            <PageHero size="sm" title="Your orders" />

            <Section className="pt-0">
              <div className="mx-auto max-w-2xl">
                {orders.length === 0 ? (
                    <Card className="mt-6">
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No orders yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="mt-6 space-y-3">
                        {orders.map((order) => (
                            <Link key={order.id} href={`/orders/${order.id}`}>
                                <Card className="transition-shadow hover:shadow-md">
                                    <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                                        <div>
                                            <p className="font-medium">{order.seller?.business_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.items.length} item{order.items.length !== 1 ? 's' : ''} · $
                                                {order.total.toFixed(2)}
                                            </p>
                                        </div>
                                        <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                            {statusLabel[order.status]}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
              </div>
            </Section>
        </CustomerLayout>
    );
}
