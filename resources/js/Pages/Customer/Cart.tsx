import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/types/cart';

interface Props {
    items: CartItem[];
}

export default function Cart({ items: initialItems }: Props) {
    const [items, setItems] = useState(initialItems);
    const total = useMemo(() => items.reduce((sum, i) => sum + i.line_total, 0), [items]);

    async function updateQuantity(id: number, quantity: number) {
        if (quantity < 1) return;
        const updated = await api.put<CartItem>(`/cart/${id}`, { quantity });
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    }

    async function remove(id: number) {
        await api.delete(`/cart/${id}`);
        setItems((prev) => prev.filter((i) => i.id !== id));
    }

    return (
        <CustomerLayout>
            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="font-heading text-2xl font-semibold">Your cart</h1>

                {items.length === 0 ? (
                    <Card className="mt-6">
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Your cart is empty.{' '}
                            <Link href="/search" className="text-primary underline">
                                Find a bakery
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <p className="mt-1 text-sm text-muted-foreground">
                            From <span className="font-medium">{items[0].seller.business_name}</span>
                        </p>

                        <div className="mt-4 space-y-3">
                            {items.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                                        <div>
                                            <p className="font-medium">
                                                {item.product_name}
                                                {item.variant_name && (
                                                    <span className="text-muted-foreground"> — {item.variant_name}</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                ${item.unit_price.toFixed(2)} each
                                            </p>
                                            {item.customization_notes && (
                                                <p className="mt-1 text-xs text-muted-foreground italic">
                                                    "{item.customization_notes}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center rounded-md border">
                                                <button
                                                    type="button"
                                                    className="min-h-9 min-w-9 px-2"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>
                                                <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    className="min-h-9 min-w-9 px-2"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="w-16 text-right font-medium">
                                                ${item.line_total.toFixed(2)}
                                            </span>
                                            <AlertDialog>
                                                <AlertDialogTrigger className="min-h-9 px-2 text-sm text-destructive">
                                                    Remove
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Remove "{item.product_name}"?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This removes the item from your cart.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => remove(item.id)}>
                                                            Remove
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                            <span className="text-lg font-semibold">Total</span>
                            <span className="text-lg font-semibold">${total.toFixed(2)}</span>
                        </div>

                        <Link
                            href="/checkout"
                            className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-full min-h-11')}
                        >
                            Proceed to checkout
                        </Link>
                    </>
                )}
            </div>
        </CustomerLayout>
    );
}
