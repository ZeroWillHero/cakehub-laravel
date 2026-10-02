import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ResolvedComponent } from '@inertiajs/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import LoadingScreen from '@/components/shared/LoadingScreen';
import Toaster from '@/components/shared/Toaster';

createInertiaApp({
    // Thin brand-colored bar across the top on every page change. The
    // delay keeps it from flickering on quick visits.
    progress: { color: '#EF88AD', delay: 200, showSpinner: false },
    // Each page is its own chunk, so the first visit only downloads the page
    // being opened instead of the whole app (much faster on mobile data).
    resolve: async (name) => {
        const pages = import.meta.glob<{ default: ResolvedComponent }>([
            './Pages/**/*.tsx',
            '!./Pages/**/*.test.tsx',
        ]);
        return (await pages[`./Pages/${name}.tsx`]()).default;
    },
    setup({ el, App, props }) {
        if (!el) return;
        document.getElementById('app-splash')?.remove();
        createRoot(el).render(
            <TooltipProvider>
                <LoadingScreen />
                <Toaster />
                <App {...props} />
            </TooltipProvider>,
        );
    },
});
