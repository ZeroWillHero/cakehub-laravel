import CustomerLayout from '@/Layouts/CustomerLayout';

export default function Welcome() {
    return (
        <CustomerLayout>
            <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:px-6">
                <h1 className="font-heading text-4xl font-semibold sm:text-5xl">CakeHub</h1>
                <p className="text-lg text-muted-foreground">
                    Find local cake sellers by category and location, or list your own bakery.
                </p>
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        Sign up with <span className="font-medium text-foreground">Continue with Google</span> in the
                        menu above — CakeHub uses your Google account, so there is no password to create or remember.
                    </p>
                    <p>
                        We only receive your name, email address and profile picture from Google. After signing in you
                        choose whether you are here to <span className="font-medium text-foreground">buy cakes</span> or
                        to <span className="font-medium text-foreground">sell as a bakery</span>, and you can finish the
                        rest of your profile from your account page at any time.
                    </p>
                </div>
            </div>
        </CustomerLayout>
    );
}
