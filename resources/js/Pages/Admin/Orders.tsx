import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminDataTable, { type AdminColumn } from '@/components/shared/AdminDataTable';
import { statusTone } from '@/lib/statusTone';
import { useListFilters } from '@/lib/useListFilters';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus, PaymentStatus } from '@/types/order';
import type { Paginated } from '@/types/pagination';

interface Filters {
    search: string;
    status: OrderStatus | null;
    payment_status: PaymentStatus | null;
    from: string | null;
    to: string | null;
    customer: number | null;
    seller: number | null;
    [key: string]: string | number | null;
}

interface Props {
    orders: Paginated<Order>;
    filters: Filters;
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

const paymentLabel: Record<PaymentStatus, string> = {
    pending: 'Pending',
    awaiting_verification: 'Awaiting verification',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
};

const money = (amount: number) => `$${amount.toFixed(2)}`;

const columns: AdminColumn<Order>[] = [
    { key: 'id', header: 'Order', cell: (order) => <span className="font-medium">#{order.id}</span> },
    {
        key: 'date',
        header: 'Placed',
        cell: (order) => new Date(order.created_at).toLocaleDateString(),
        className: 'hidden sm:table-cell',
    },
    { key: 'customer', header: 'Customer', cell: (order) => order.customer?.name ?? '—' },
    {
        key: 'seller',
        header: 'Seller',
        cell: (order) => order.seller?.business_name ?? '—',
        className: 'hidden md:table-cell',
    },
    { key: 'total', header: 'Total', cell: (order) => money(order.total), className: 'text-right' },
    {
        key: 'status',
        header: 'Status',
        cell: (order) => (
            <Badge variant="secondary" className={statusTone(order.status)}>
                {statusLabel[order.status]}
            </Badge>
        ),
    },
    {
        key: 'payment',
        header: 'Payment',
        cell: (order) => (
            <Badge variant="secondary" className={statusTone(order.payment_status)}>
                {paymentLabel[order.payment_status]}
            </Badge>
        ),
        className: 'hidden lg:table-cell',
    },
];

export default function AdminOrders({ orders, filters }: Props) {
    const list = useListFilters(filters, ['orders', 'filters']);
    const [selected, setSelected] = useState<Order | null>(null);

    const scopedTo = filters.customer
        ? orders.data[0]?.customer?.name
            ? `customer ${orders.data[0].customer.name}`
            : 'one customer'
        : filters.seller
          ? orders.data[0]?.seller?.business_name
              ? `seller ${orders.data[0].seller.business_name}`
              : 'one seller'
          : null;

    const hasActiveFilters = Boolean(
        filters.search || filters.status || filters.payment_status || filters.from || filters.to || filters.customer || filters.seller,
    );

    return (
        <AdminLayout breadcrumb={['Orders']}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-2xl font-semibold">Orders</h1>
                {scopedTo && (
                    <p className="text-sm text-muted-foreground">
                        Showing orders for {scopedTo} ·{' '}
                        <button
                            type="button"
                            className="underline underline-offset-4 hover:text-foreground"
                            onClick={() => list.setFilters({ customer: null, seller: null })}
                        >
                            Show all orders
                        </button>
                    </p>
                )}
            </div>

            <AdminDataTable
                rows={orders.data}
                columns={columns}
                meta={orders.meta}
                rowKey={(order) => order.id}
                rowLabel={(order) => `Order #${order.id}, ${order.customer?.name ?? ''}, ${statusLabel[order.status]}`}
                onRowClick={setSelected}
                search={filters.search}
                searchPlaceholder="Search order #, customer or seller"
                onSearch={(search) => list.setFilters({ search })}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => list.clear()}
                onPageChange={list.setPage}
                pageHref={list.pageHref}
                loading={list.loading}
                emptyMessage="No orders have been placed yet."
                filters={
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="status_filter" className="text-xs">
                                Status
                            </Label>
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(v) => list.setFilters({ status: v === 'all' ? null : (v as OrderStatus) })}
                            >
                                <SelectTrigger id="status_filter" className="w-40">
                                    <SelectValue>
                                        {(value: OrderStatus | 'all') => (value === 'all' ? 'All statuses' : statusLabel[value])}
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
                            <Label htmlFor="payment_filter" className="text-xs">
                                Payment
                            </Label>
                            <Select
                                value={filters.payment_status ?? 'all'}
                                onValueChange={(v) =>
                                    list.setFilters({ payment_status: v === 'all' ? null : (v as PaymentStatus) })
                                }
                            >
                                <SelectTrigger id="payment_filter" className="w-48">
                                    <SelectValue>
                                        {(value: PaymentStatus | 'all') => (value === 'all' ? 'All payments' : paymentLabel[value])}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All payments</SelectItem>
                                    {Object.entries(paymentLabel).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="from_filter" className="text-xs">
                                Placed from
                            </Label>
                            <Input
                                id="from_filter"
                                type="date"
                                value={filters.from ?? ''}
                                max={filters.to ?? undefined}
                                onChange={(e) => list.setFilters({ from: e.target.value || null })}
                                className="w-40"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="to_filter" className="text-xs">
                                Placed to
                            </Label>
                            <Input
                                id="to_filter"
                                type="date"
                                value={filters.to ?? ''}
                                min={filters.from ?? undefined}
                                onChange={(e) => list.setFilters({ to: e.target.value || null })}
                                className="w-40"
                            />
                        </div>
                    </>
                }
            />

            <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
                    {selected && <OrderDetails order={selected} />}
                </SheetContent>
            </Sheet>
        </AdminLayout>
    );
}

function OrderDetails({ order }: { order: Order }) {
    const address = order.delivery_address;

    return (
        <>
            <SheetHeader>
                <SheetTitle>Order #{order.id}</SheetTitle>
                <SheetDescription>Placed {new Date(order.created_at).toLocaleString()}</SheetDescription>
                <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary" className={statusTone(order.status)}>
                        {statusLabel[order.status]}
                    </Badge>
                    <Badge variant="secondary" className={statusTone(order.payment_status)}>
                        Payment: {paymentLabel[order.payment_status]}
                    </Badge>
                </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-6 text-sm">
                <section className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-medium">{order.customer?.name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Seller</p>
                        <p className="font-medium">{order.seller?.business_name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">{order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                        <p className="font-medium">{new Date(order.scheduled_at).toLocaleString()}</p>
                    </div>
                    {address && (
                        <div>
                            <p className="text-xs text-muted-foreground">Delivery address</p>
                            <p className="font-medium">
                                {[address.line1, address.line2, address.city, address.postal_code].filter(Boolean).join(', ')}
                            </p>
                        </div>
                    )}
                </section>

                {order.status === 'cancelled' && order.cancelled_reason && (
                    <p className="rounded-lg bg-destructive/10 p-3 text-destructive">Cancelled: {order.cancelled_reason}</p>
                )}

                <Separator />

                <section>
                    <h3 className="mb-2 font-medium">Items</h3>
                    <ul className="flex flex-col gap-3">
                        {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium">
                                        {item.quantity} × {item.product_name}
                                        {item.variant_name && <span className="text-muted-foreground"> ({item.variant_name})</span>}
                                    </p>
                                    {item.customization_notes && (
                                        <p className="text-xs text-muted-foreground">“{item.customization_notes}”</p>
                                    )}
                                </div>
                                <span className="shrink-0">{money(item.unit_price * item.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="flex flex-col gap-1 border-t pt-3">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{money(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Delivery fee</span>
                        <span>{money(order.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{money(order.total)}</span>
                    </div>
                </section>

                <div className="flex flex-wrap gap-2">
                    {order.seller && (
                        <Link
                            href={`/admin/sellers/${order.seller.id}`}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                            View seller
                        </Link>
                    )}
                    {order.customer && (
                        <Link
                            href={`/admin/orders?customer=${order.customer.id}`}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                            Customer&apos;s orders
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
