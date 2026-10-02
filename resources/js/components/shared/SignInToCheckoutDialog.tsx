import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import GoogleIcon from '@/components/shared/GoogleIcon';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Shown when a signed-out visitor heads to checkout. Browsing and the cart
 * work without an account; placing the order needs one
 * (docs/plan-public-browsing-guest-cart.md). The cart stays in their
 * session and is moved into the account after sign-in.
 */
export default function SignInToCheckoutDialog({ open, onOpenChange }: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sign in to check out</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your cart is saved. After you sign in, you'll come straight back here to finish your order.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <p className="text-sm text-muted-foreground">
                    CakeHub uses your Google account, so there's no password to create or remember. We only receive
                    your name, email address and profile picture from Google.
                </p>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep browsing</AlertDialogCancel>
                    {/* A full-page link, not an Inertia <Link>: /checkout sends
                        guests on to Google, which an XHR visit can't follow.
                        The server remembers /checkout and returns here after
                        sign-in. */}
                    <a href="/checkout" className={cn(buttonVariants(), 'min-h-11 items-center gap-2')}>
                        <GoogleIcon className="size-4" />
                        Continue with Google
                    </a>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
