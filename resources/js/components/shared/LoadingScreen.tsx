import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import Spinner from '@/components/shared/Spinner';

export default function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const removeStartListener = router.on('start', () => setIsLoading(true));
        const removeFinishListener = router.on('finish', () => setIsLoading(false));

        return () => {
            removeStartListener();
            removeFinishListener();
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
