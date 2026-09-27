import { Link } from '@inertiajs/react';

export default function SiteFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-muted">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-3">
                    <div>
                        <p className="font-heading text-lg font-semibold text-foreground">CakeHub</p>
                        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                            Discover cakes from local bakers and order directly, or say hello on WhatsApp.
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-foreground">Browse</p>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/search" className="hover:text-foreground">
                                    Search
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="hover:text-foreground">
                                    Categories
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-foreground">Account</p>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/orders" className="hover:text-foreground">
                                    Orders
                                </Link>
                            </li>
                            <li>
                                <Link href="/cart" className="hover:text-foreground">
                                    Cart
                                </Link>
                            </li>
                            <li>
                                <Link href="/account" className="hover:text-foreground">
                                    Account
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
                    © {year} CakeHub. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
