import { router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
    iconOnly?: boolean;
}

export default function LogoutButton({ className, iconOnly = false }: Props) {
    function handleLogout() {
        router.post('/logout');
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className={cn(
                'inline-flex items-center gap-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted',
                iconOnly ? 'size-9 justify-center' : 'px-3 py-2',
                className,
            )}
        >
            <LogOut className="size-4" />
            {!iconOnly && 'Log out'}
        </button>
    );
}
