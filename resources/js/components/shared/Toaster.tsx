import { useSyncExternalStore } from 'react';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { dismissToast, getToasts, subscribeToasts } from '@/lib/toast';
import { cn } from '@/lib/utils';

/** Stack of short notifications in the top-right (top-center on phones). */
export default function Toaster() {
    const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

    return (
        <div
            className="pointer-events-none fixed inset-x-0 top-3 z-60 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
            aria-live="polite"
        >
            {toasts.map((item) => (
                <div
                    key={item.id}
                    role={item.tone === 'error' ? 'alert' : 'status'}
                    className={cn(
                        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-popover p-3 text-sm text-popover-foreground shadow-lg animate-in fade-in slide-in-from-top-2',
                        item.tone === 'error' && 'border-destructive/40',
                    )}
                >
                    {item.tone === 'success' ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                    ) : (
                        <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                    )}
                    <p className="flex-1">{item.message}</p>
                    <button
                        type="button"
                        onClick={() => dismissToast(item.id)}
                        className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Dismiss notification"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
