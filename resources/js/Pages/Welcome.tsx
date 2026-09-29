import CustomerLayout from '@/Layouts/CustomerLayout';
import GoogleIcon from '@/components/shared/GoogleIcon';
import PageHero from '@/components/shared/PageHero';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Welcome() {
    return (
        <CustomerLayout>
            <PageHero
                size="lg"
                title="CakeHub"
                subtitle="Find local cake sellers by category and location, or list your own bakery."
                actions={
                    <div className="flex flex-col items-center gap-4">
                        <a
                            href="/auth/google/redirect"
                            className={cn(buttonVariants({ size: 'lg' }), 'min-h-11 items-center gap-2')}
                        >
                            <GoogleIcon className="size-5" />
                            Continue with Google
                        </a>
                        <div className="max-w-md space-y-3 text-sm text-muted-foreground">
                            <p>
                                CakeHub uses your Google account, so there is no password to create or remember. We
                                only receive your name, email address and profile picture from Google.
                            </p>
                            <p>
                                After signing in you choose whether you are here to{' '}
                                <span className="font-medium text-foreground">buy cakes</span> or to{' '}
                                <span className="font-medium text-foreground">sell as a bakery</span>, and you can
                                finish the rest of your profile from your account page at any time.
                            </p>
                        </div>
                    </div>
                }
            />
        </CustomerLayout>
    );
}
