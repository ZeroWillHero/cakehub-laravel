import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import NotificationBell from '@/components/shared/NotificationBell';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search' },
    { label: 'Orders', href: '/orders' },
    { label: 'Cart', href: '/cart' },
    { label: 'Account', href: '/account' },
];

export default function SiteHeader() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link href="/" className="font-heading text-xl font-semibold text-foreground">
                    CakeHub
                    {/* add logo here  */}
                </Link>

                <NavigationMenu className="hidden md:flex">
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
                    <div className="hidden md:block">
                        <NotificationBell />
                    </div>

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
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
