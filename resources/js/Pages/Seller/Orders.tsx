import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SellerLayout from '@/Layouts/SellerLayout';
import Spinner from '@/components/shared/Spinner';
import { api } from '@/lib/api';
import type { Order, OrderStatus } from '@/types/order';

interface Props {
    orders: Order[];
    filters: {
        status: OrderStatus | null;
        from: string | null;
        to: string | null;
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

export default function SellerOrders({ orders: initialOrders, filters }: Props) {
    const [orders, setOrders] = useState(initialOrders);
    const [updating, setUpdating] = useState<number | null>(null);
    const [status, setStatus] = useState<OrderStatus | 'all'>(filters.status ?? 'all');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    function applyFilters(next: { status?: OrderStatus | 'all'; from?: string; to?: string }) {
        const merged = {
            status: next.status ?? status,
            from: next.from ?? from,
            to: next.to ?? to,
        };
        router.reload({
            data: {
                status: merged.status === 'all' ? undefined : merged.status,
                from: merged.from || undefined,
                to: merged.to || undefined,
            },
            only: ['orders', 'filters'],
            onSuccess: (page) => setOrders(page.props.orders as Order[]),
        });
    }

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
                        <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                            {statusLabel[order.status]}
                        </Badge>
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
                    {order.allowed_next_statuses.length > 0 && (
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
                                    {updating === order.id && <Spinner className="mr-2" />}
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
        <SellerLayout breadcrumb={['Orders']}>
            <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                    <Label htmlFor="status_filter" className="text-xs">
                        Status
                    </Label>
                    <Select
                        value={status}
                        onValueChange={(v) => {
                            setStatus(v as OrderStatus | 'all');
                            applyFilters({ status: v as OrderStatus | 'all' });
                        }}
                    >
                        <SelectTrigger id="status_filter" className="w-40">
                            <SelectValue>
                                {(value: OrderStatus | 'all') =>
                                    value === 'all' ? 'All statuses' : statusLabel[value]
                                }
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {Object.entries(statusLabel).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="from_filter" className="text-xs">
                        From
                    </Label>
                    <Input
                        id="from_filter"
                        type="date"
                        value={from}
                        onChange={(e) => {
                            setFrom(e.target.value);
                            applyFilters({ from: e.target.value });
                        }}
                        className="w-40"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="to_filter" className="text-xs">
                        To
                    </Label>
                    <Input
                        id="to_filter"
                        type="date"
                        value={to}
                        onChange={(e) => {
                            setTo(e.target.value);
                            applyFilters({ to: e.target.value });
                        }}
                        className="w-40"
                    />
                </div>
            </div>

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
        </SellerLayout>
    );
}
