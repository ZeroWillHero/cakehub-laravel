import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/shared/Spinner';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import type { CartItem } from '@/types/cart';

export interface PendingMerge {
    saved: CartItem[];
    incoming: CartItem[];
}

type Choice = 'saved' | 'incoming';

/** Only ever follow a redirect back into this site. */
function sameOriginOrCart(url: string | null): string {
    if (!url) return '/cart';
    try {
        return new URL(url, window.location.origin).origin === window.location.origin ? url : '/cart';
    } catch {
        return '/cart';
    }
}

function summary(items: CartItem[]): string {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.line_total, 0);
    return `${count} item${count === 1 ? '' : 's'} · $${total.toFixed(2)}`;
}

/**
 * Orders come from one seller at a time, so when a customer signs in with a
 * guest cart from a different seller than the cart already saved on their
 * account, they choose which one to keep. Nothing is replaced until they
 * do (docs/plan-public-browsing-guest-cart.md D3).
 */
export default function CartMergeDialog({ pendingMerge }: { pendingMerge: PendingMerge }) {
    const [busy, setBusy] = useState<Choice | null>(null);
    const [error, setError] = useState<string | null>(null);

    const savedSeller = pendingMerge.saved[0]?.seller.business_name ?? 'your saved cart';
    const incomingSeller = pendingMerge.incoming[0]?.seller.business_name ?? 'your new cart';

    async function keep(choice: Choice) {
        setBusy(choice);
        setError(null);
        try {
            const result = await api.post<{ redirect_to: string | null }>('/cart/merge', { keep: choice });
            // Normally back to /checkout, where they were heading before
            // signing in; otherwise reload the cart with the chosen items.
            router.visit(sameOriginOrCart(result.redirect_to), { replace: true });
        } catch (err) {
            setError(errorMessage(err, 'keep', "We couldn't update your cart. Please try again."));
            setBusy(null);
        }
    }

    const options: { choice: Choice; seller: string; items: CartItem[]; note: string }[] = [
        { choice: 'incoming', seller: incomingSeller, items: pendingMerge.incoming, note: 'The cart you just built' },
        { choice: 'saved', seller: savedSeller, items: pendingMerge.saved, note: 'Already saved on your account' },
    ];

    return (
        <AlertDialog open>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Which cart do you want to keep?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your account already had a cart from {savedSeller}. Orders come from one seller at a time, so
                        pick one. The other cart will be cleared.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {error && (
                    <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                        {error}
                    </p>
                )}

                <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                    {options.map((option) => (
                        <Button
                            key={option.choice}
                            type="button"
                            variant={option.choice === 'incoming' ? 'default' : 'outline'}
                            className="h-auto min-h-11 w-full flex-col items-start gap-0.5 py-2 text-left"
                            disabled={busy !== null}
                            onClick={() => keep(option.choice)}
                        >
                            <span className="flex items-center gap-2 font-medium">
                                {busy === option.choice && <Spinner size={14} />}
                                Keep {option.seller}
                            </span>
                            <span className="text-xs font-normal opacity-80">
                                {option.note} · {summary(option.items)}
                            </span>
                        </Button>
                    ))}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
