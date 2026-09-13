import { useEffect, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import Spinner from '@/components/shared/Spinner';

export default function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(false);
    const page = usePage();
    const previousComponentRef = useRef(page.component);

    useEffect(() => {
        // Detect page component changes (navigation)
        if (previousComponentRef.current !== page.component) {
            setIsLoading(false);
        }
        previousComponentRef.current = page.component;
    }, [page.component]);

    // Handle page navigation start by listening to link clicks
    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            // Show loader on link clicks (except for links with data-no-loading attribute)
            if (target && target.href && !target.getAttribute('data-no-loading')) {
                setIsLoading(true);
            }
        };

        document.addEventListener('click', handleLinkClick);

        return () => {
            document.removeEventListener('click', handleLinkClick);
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Spinner size={48} />
                <div className="space-y-2 text-center">
                    <h2 className="text-lg font-semibold text-foreground">Loading CakeHub</h2>
                    <p className="text-sm text-muted-foreground">Please wait while we load your content...</p>
                </div>
            </div>
        </div>
    );
}
