import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
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

export default function SellerOrders({ orders: initialOrders }: Props) {
    const [orders, setOrders] = useState(initialOrders);
    const [updating, setUpdating] = useState<number | null>(null);

    const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
    const history = orders.filter((o) => ['completed', 'cancelled'].includes(o.status));

    async function advance(order: Order, status: OrderStatus) {
        setUpdating(order.id);
        try {
            const updated = await api.patch<Order>(`/seller/orders/${order.id}/status`, { status });
            setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
        } finally {
            setUpdating(null);
        }
    }

    function OrderCard({ order }: { order: Order }) {
        return (
            <Card>
                <CardContent className="space-y-3 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="font-medium">
                                Order #{order.id} — {order.customer?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''} · $
                                {order.total.toFixed(2)} · {new Date(order.scheduled_at).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {order.payment_status !== 'paid' && (
                                <Badge variant="outline">
                                    {order.payment_status === 'awaiting_verification'
                                        ? 'Awaiting payment verification'
                                        : 'Awaiting payment'}
                                </Badge>
                            )}
                            <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                {statusLabel[order.status]}
                            </Badge>
                        </div>
                    </div>
                    <ul className="text-sm text-muted-foreground">
                        {order.items.map((item) => (
                            <li key={item.id}>
                                {item.quantity}× {item.product_name}
                                {item.variant_name && ` — ${item.variant_name}`}
                                {item.customization_notes && ` ("${item.customization_notes}")`}
                            </li>
                        ))}
                    </ul>
                    {order.allowed_next_statuses.length > 0 && order.payment_status !== 'paid' && (
                        <p className="text-sm text-muted-foreground">
                            This order cannot progress until its payment has been verified.
                        </p>
                    )}
                    {order.allowed_next_statuses.length > 0 && order.payment_status === 'paid' && (
                        <div className="flex flex-wrap gap-2">
                            {order.allowed_next_statuses.map((status) => (
                                <Button
                                    key={status}
                                    type="button"
                                    size="sm"
                                    variant={status === 'cancelled' ? 'outline' : 'default'}
                                    disabled={updating === order.id}
                                    onClick={() => advance(order, status)}
                                >
                                    Mark {statusLabel[status]}
                                </Button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold">Active orders</h1>
                    {active.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">No active orders.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {active.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold">History</h2>
                        <div className="mt-4 space-y-3">
                            {history.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
