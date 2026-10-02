import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { WifiOff, X } from 'lucide-react';
import Spinner from '@/components/shared/Spinner';

type Notice = 'hidden' | 'loading' | 'slow' | 'offline';

/** Wait this long before saying anything — most page changes finish sooner. */
const SHOW_AFTER_MS = 1200;
const SLOW_AFTER_MS = 8000;

/**
 * Page-change feedback that doesn't get in the way. The thin top progress
 * bar (Inertia's built-in one, styled in app.tsx/app.css) covers every
 * navigation; this adds a small, non-blocking "Loading, please wait…" pill
 * only when a page is genuinely slow, a gentler nudge if it's very slow,
 * and a clear message when the connection drops. It never covers the page,
 * so quick clicks no longer flash a full-screen overlay.
 */
export default function LoadingScreen() {
    const [notice, setNotice] = useState<Notice>('hidden');
    const timers = useRef<number[]>([]);

    useEffect(() => {
        function clearTimers() {
            timers.current.forEach((t) => window.clearTimeout(t));
            timers.current = [];
        }

        const removeStart = router.on('start', (event) => {
            // Prefetches happen in the background — the person isn't waiting on them.
            if (event.detail.visit.prefetch) return;
            clearTimers();
            timers.current.push(
                window.setTimeout(() => setNotice('loading'), SHOW_AFTER_MS),
                window.setTimeout(() => setNotice('slow'), SLOW_AFTER_MS),
            );
        });
        const removeFinish = router.on('finish', () => {
            clearTimers();
            setNotice((current) => (current === 'offline' ? current : 'hidden'));
        });
        const removeNetworkError = router.on('networkError', () => {
            clearTimers();
            setNotice('offline');
        });

        return () => {
            clearTimers();
            removeStart();
            removeFinish();
            removeNetworkError();
        };
    }, []);

    if (notice === 'hidden') return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-60 flex justify-center px-4 sm:bottom-8" aria-live="polite">
            <div
                role="status"
                className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border bg-popover px-4 py-2.5 text-sm text-popover-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2"
            >
                {notice === 'offline' ? (
                    <>
                        <WifiOff className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                        <span>You seem to be offline. Check your internet connection and try again.</span>
                        <button
                            type="button"
                            onClick={() => setNotice('hidden')}
                            className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                            aria-label="Dismiss"
                        >
                            <X className="size-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <Spinner size={16} className="shrink-0 text-primary" />
                        <span>
                            {notice === 'slow'
                                ? 'Still loading — this is taking longer than usual…'
                                : 'Loading, please wait…'}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
