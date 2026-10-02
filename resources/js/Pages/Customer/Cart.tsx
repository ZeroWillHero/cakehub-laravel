import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
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
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CustomerLayout from '@/Layouts/CustomerLayout';
import CartMergeDialog, { type PendingMerge } from '@/components/shared/CartMergeDialog';
import PageHero from '@/components/shared/PageHero';
import Section from '@/components/shared/Section';
import SignInToCheckoutDialog from '@/components/shared/SignInToCheckoutDialog';
import Spinner from '@/components/shared/Spinner';
import { cartApi } from '@/lib/cart';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/types/cart';
import type { SharedPageProps } from '@/types/shared';

interface Props {
    items: CartItem[];
    /** Set right after sign-in when the guest cart and the saved cart are from different sellers. */
    pendingMerge: PendingMerge | null;
}

export default function Cart({ items: initialItems, pendingMerge }: Props) {
    // Signed-out visitors' carts live in their session (/api/guest-cart).
    const isGuest = (usePage<SharedPageProps>().props.auth?.user ?? null) === null;
    const cart = cartApi(isGuest);
    const [items, setItems] = useState(initialItems);
    const [signInOpen, setSignInOpen] = useState(false);
    const total = useMemo(() => items.reduce((sum, i) => sum + i.line_total, 0), [items]);

    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function updateQuantity(id: number, quantity: number) {
        if (quantity < 1) return;
        setBusyId(id);
        setError(null);
        try {
            const updated = await cart.updateQuantity(id, quantity);
            setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
        } catch (err) {
            setError(errorMessage(err, 'quantity', "We couldn't update the quantity. Please try again."));
        } finally {
            setBusyId(null);
        }
    }

    async function remove(id: number) {
        setBusyId(id);
        setError(null);
        try {
            await cart.remove(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            setError(errorMessage(err, undefined, "We couldn't remove that item. Please try again."));
        } finally {
            setBusyId(null);
        }
    }

    return (
        <CustomerLayout>
            <PageHero size="sm" title="Your cart" />

            <Section className="pt-0">
              <div className="mx-auto max-w-2xl">
                {items.length === 0 ? (
                    <Card className="mt-6">
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
                            <p className="font-medium">Your cart is empty</p>
                            <p className="text-sm text-muted-foreground">Browse cakes from local bakers and add your favorites.</p>
                            <Link href="/products" className={cn(buttonVariants(), 'mt-2 min-h-11')}>
                                Browse cakes
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <p className="mt-1 text-sm text-muted-foreground">
                            From <span className="font-medium">{items[0].seller.business_name}</span>
                        </p>

                        {error && (
                            <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                                {error}
                            </p>
                        )}

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
                                                    className="min-h-11 min-w-11 px-2 text-lg disabled:opacity-40"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={busyId === item.id || item.quantity <= 1}
                                                    aria-label={`Decrease quantity of ${item.product_name}`}
                                                >
                                                    −
                                                </button>
                                                <span className="inline-flex min-w-8 justify-center text-sm font-medium" aria-live="polite">
                                                    {busyId === item.id ? <Spinner size={14} /> : item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="min-h-11 min-w-11 px-2 text-lg disabled:opacity-40"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    disabled={busyId === item.id}
                                                    aria-label={`Increase quantity of ${item.product_name}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="w-16 text-right font-medium">
                                                ${item.line_total.toFixed(2)}
                                            </span>
                                            <AlertDialog>
                                                <AlertDialogTrigger className="min-h-11 px-2 text-sm font-medium text-destructive disabled:opacity-40" disabled={busyId === item.id}>
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

                        {isGuest ? (
                            <Button
                                type="button"
                                size="lg"
                                className="mt-4 w-full min-h-11"
                                onClick={() => setSignInOpen(true)}
                            >
                                Proceed to checkout
                            </Button>
                        ) : (
                            <Link
                                href="/checkout"
                                className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-full min-h-11')}
                            >
                                Proceed to checkout
                            </Link>
                        )}
                    </>
                )}
              </div>
            </Section>

            {isGuest && <SignInToCheckoutDialog open={signInOpen} onOpenChange={setSignInOpen} />}
            {pendingMerge && <CartMergeDialog pendingMerge={pendingMerge} />}
        </CustomerLayout>
    );
}
