import { router } from '@inertiajs/react';
import { useMemo, useState, type SubmitEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomerLayout from '@/Layouts/CustomerLayout';
import PageHero from '@/components/shared/PageHero';
import Section from '@/components/shared/Section';
import Spinner from '@/components/shared/Spinner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Address } from '@/types/address';
import type { CartItem } from '@/types/cart';
import type { DeliveryType, Order } from '@/types/order';

interface Props {
    items: CartItem[];
    addresses: Address[];
}

export default function Checkout({ items, addresses }: Props) {
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
    const [addressId, setAddressId] = useState<number | null>(addresses.find((a) => a.is_default)?.id ?? null);
    const [scheduledAt, setScheduledAt] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    const total = useMemo(() => items.reduce((sum, i) => sum + i.line_total, 0), [items]);

    const submit: SubmitEventHandler = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const order = await api.post<Order>('/checkout', {
                delivery_type: deliveryType,
                delivery_address_id: deliveryType === 'delivery' ? addressId : null,
                scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            });
            router.visit(`/orders/${order.id}?placed=1`);
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]> };
            setErrors(apiError.errors ?? {});
        } finally {
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <CustomerLayout>
                <PageHero size="sm" title="Checkout" />
                <Section className="pt-0">
                    <p className="text-center text-muted-foreground">Your cart is empty.</p>
                </Section>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <PageHero size="sm" title="Checkout" />

            <Section className="pt-0">
              <div className="mx-auto max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Order summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                    {item.quantity}× {item.product_name}
                                </span>
                                <span>${item.line_total.toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between border-t pt-2 font-semibold">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Payment is handled directly with the seller — this step only reserves your order.
                        </p>
                    </CardContent>
                </Card>

                <form onSubmit={submit} className="mt-6 space-y-5">
                    <div className="space-y-2">
                        <Label>Delivery method</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['pickup', 'delivery'] as DeliveryType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setDeliveryType(type)}
                                    className={cn(
                                        'min-h-11 rounded-lg border p-3 text-left capitalize',
                                        deliveryType === type ? 'border-primary bg-primary/5' : '',
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {deliveryType === 'delivery' && (
                        <div className="space-y-2">
                            <Label>Delivery address</Label>
                            {addresses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No saved addresses.{' '}
                                    <a href="/account" className="text-primary underline">
                                        Add one
                                    </a>
                                    .
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {addresses.map((address) => (
                                        <label
                                            key={address.id}
                                            className="flex min-h-11 items-center gap-2 rounded-md border p-2 text-sm"
                                        >
                                            <input
                                                type="radio"
                                                name="address"
                                                checked={addressId === address.id}
                                                onChange={() => setAddressId(address.id)}
                                            />
                                            {address.line1}, {address.city}
                                        </label>
                                    ))}
                                </div>
                            )}
                            {errors.delivery_address_id && (
                                <p className="text-sm text-destructive">{errors.delivery_address_id[0]}</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="scheduled_at">
                            {deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} date & time
                        </Label>
                        <Input
                            id="scheduled_at"
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            aria-invalid={Boolean(errors.scheduled_at)}
                        />
                        {errors.scheduled_at && (
                            <p className="text-sm text-destructive">{errors.scheduled_at[0]}</p>
                        )}
                    </div>

                    {errors.cart && <p className="text-sm text-destructive">{errors.cart[0]}</p>}

                    <Button type="submit" size="lg" className="w-full min-h-11" disabled={submitting}>
                        {submitting && <Spinner className="mr-2" />}
                        {submitting ? 'Placing order…' : 'Place order'}
                    </Button>
                </form>
              </div>
            </Section>
        </CustomerLayout>
    );
}
