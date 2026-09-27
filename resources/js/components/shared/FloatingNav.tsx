import { Link, usePage } from '@inertiajs/react';
import { House, Search, ShoppingCart, Package, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/shared/NotificationBell';
import type { SharedPageProps } from '@/types/shared';

const items = [
    { label: 'Home', href: '/', icon: House },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Cart', href: '/cart', icon: ShoppingCart },
    { label: 'Orders', href: '/orders', icon: Package },
];

interface Props {
    visible: boolean;
}

/** Bottom pill nav that swaps in for the top header once the page scrolls down. */
export default function FloatingNav({ visible }: Props) {
    const { props, url } = usePage<SharedPageProps>();
    const user = props.auth?.user ?? null;

    return (
        <nav
            aria-hidden={!visible}
            className={cn(
                'fixed inset-x-0 bottom-6 z-50 flex justify-center transition-all duration-300',
                visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-24 opacity-0',
            )}
        >
            <div className="flex items-center gap-1 rounded-full border border-border bg-card/95 px-2 py-2 shadow-lg backdrop-blur">
                {items.map((item) => {
                    const Icon = item.icon;
                    const active = url === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            className={cn(
                                'flex size-10 items-center justify-center rounded-full transition-colors',
                                active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
                            )}
                        >
                            <Icon className="size-5" />
                        </Link>
                    );
                })}

                <NotificationBell />

                {user ? (
                    <Link href="/account" aria-label="Account">
                        <Avatar className="size-8">
                            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                            <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                ) : (
                    <Button type="button" variant="ghost" size="icon" render={<Link href="/account" aria-label="Account" />}>
                        <User className="size-5" />
                    </Button>
                )}
            </div>
        </nav>
    );
}
