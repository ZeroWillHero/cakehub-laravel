import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { Order, OrderStatus } from '@/types/order';

interface Props {
    order: Order;
}

const timeline: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready', 'delivered', 'completed'];

const statusLabel: Record<OrderStatus, string> = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

export default function OrderDetail({ order }: Props) {
    const currentIndex = timeline.indexOf(order.status);

    return (
        <CustomerLayout>
            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="font-heading text-2xl font-semibold">Order #{order.id}</h1>
                    <Badge variant={order.status === 'cancelled' ? 'destructive' : 'default'}>
                        {statusLabel[order.status]}
                    </Badge>
                </div>

                {order.status !== 'cancelled' && (
                    <div className="mt-6 flex items-center">
                        {timeline.map((step, i) => (
                            <div key={step} className="flex flex-1 items-center last:flex-none">
                                <div className="flex flex-col items-center gap-1">
                                    <div
                                        className={`size-3 rounded-full ${i <= currentIndex ? 'bg-primary' : 'bg-muted'}`}
                                    />
                                    <span className="text-center text-[11px] text-muted-foreground">
                                        {statusLabel[step]}
                                    </span>
                                </div>
                                {i < timeline.length - 1 && (
                                    <div className={`h-0.5 flex-1 ${i < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {order.cancelled_reason && (
                    <p className="mt-4 text-sm text-destructive">Reason: {order.cancelled_reason}</p>
                )}

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base">{order.seller?.business_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                    {item.quantity}× {item.product_name}
                                    {item.variant_name && ` — ${item.variant_name}`}
                                </span>
                                <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between border-t pt-2 font-semibold">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-4">
                    <CardContent className="space-y-1 py-4 text-sm">
                        <p>
                            <span className="text-muted-foreground">
                                {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}:
                            </span>{' '}
                            {new Date(order.scheduled_at).toLocaleString()}
                        </p>
                        {order.delivery_address && (
                            <p>
                                <span className="text-muted-foreground">Address:</span>{' '}
                                {order.delivery_address.line1}, {order.delivery_address.city}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
