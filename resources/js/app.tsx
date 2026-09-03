import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ResolvedComponent } from '@inertiajs/react';
import { TooltipProvider } from '@/components/ui/tooltip';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob<{ default: ResolvedComponent }>(
            ['./Pages/**/*.tsx', '!./Pages/**/*.test.tsx'],
            { eager: true },
        );
        return pages[`./Pages/${name}.tsx`].default;
    },
    setup({ el, App, props }) {
        if (!el) return;
        createRoot(el).render(
            <TooltipProvider>
                <App {...props} />
            </TooltipProvider>,
        );
    },
});
