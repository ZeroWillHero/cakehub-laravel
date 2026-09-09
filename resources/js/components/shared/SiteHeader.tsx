import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import FloatingNav from '@/components/shared/FloatingNav';
import GoogleIcon from '@/components/shared/GoogleIcon';
import NotificationBell from '@/components/shared/NotificationBell';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useScrolledDown } from '@/lib/useScrollDirection';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types/shared';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search' },
    { label: 'Orders', href: '/orders' },
    { label: 'Cart', href: '/cart' },
    { label: 'Account', href: '/account' },
];

export default function SiteHeader() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth?.user ?? null;
    const scrolledDown = useScrolledDown();

    return (
        <>
            <header
                className={cn(
                    'sticky top-0 z-40 bg-transparent transition-transform duration-300',
                    scrolledDown ? '-translate-y-full' : 'translate-y-0',
                )}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="font-heading text-xl font-semibold text-foreground">
                        CakeHub
                        {/* add logo here  */}
                    </Link>

                    <NavigationMenu className="hidden md:flex bg-transparent">
                        <NavigationMenuList>
                            {navLinks.map((link) => (
                                <NavigationMenuItem key={link.href}>
                                    <NavigationMenuLink
                                        render={<Link href={link.href} />}
                                        className={navigationMenuTriggerStyle()}
                                    >
                                        {link.label}
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />

                        <div className="hidden md:block">
                            <NotificationBell />
                        </div>

                        {user ? (
                            <Link href="/account" className="hidden md:block" aria-label="Account">
                                <Avatar className="size-8">
                                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                                    <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Link>
                        ) : (
                            <a
                                href="/auth/google/redirect"
                                className={cn(
                                    buttonVariants({ size: 'sm' }),
                                    'hidden min-h-9 items-center gap-2 md:inline-flex',
                                )}
                            >
                                <GoogleIcon className="size-4" />
                                Continue with Google
                            </a>
                        )}

                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        aria-label="Open menu"
                                    />
                                }
                            >
                                <Menu className="size-5" />
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72">
                                <SheetHeader>
                                    <SheetTitle className="font-heading">CakeHub</SheetTitle>
                                </SheetHeader>
                                <nav className="mt-4 flex flex-col gap-1 px-4">
                                    {navLinks.map((link) => (
                                        <SheetClose
                                            key={link.href}
                                            render={<Link href={link.href} />}
                                            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            {link.label}
                                        </SheetClose>
                                    ))}
                                </nav>

                                {!user && (
                                    <a
                                        href="/auth/google/redirect"
                                        className={cn(
                                            buttonVariants({ size: 'lg' }),
                                            'mx-4 mt-6 flex min-h-11 items-center justify-center gap-2',
                                        )}
                                    >
                                        <GoogleIcon className="size-5" />
                                        Continue with Google
                                    </a>
                                )}
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            <FloatingNav visible={scrolledDown} />
        </>
    );
}
