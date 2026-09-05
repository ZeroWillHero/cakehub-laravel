import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    breadcrumb?: ReactNode;
    /** Optional media (photography) shown beside the copy — `size="lg"` only. */
    media?: ReactNode;
    size?: 'lg' | 'sm';
    className?: string;
}

/**
 * Page-header block used at the top of every Customer page. `size="lg"` is
 * reserved for the Home page (optionally two-column with `media`); every
 * other page uses the compact `size="sm"`.
 */
export default function PageHero({ title, subtitle, actions, breadcrumb, media, size = 'sm', className }: Props) {
    const isLarge = size === 'lg';

    return (
        <div className={cn(isLarge ? 'bg-accent/30' : undefined, className)}>
            <div
                className={cn(
                    'mx-auto max-w-6xl px-4 sm:px-6 lg:px-8',
                    isLarge ? 'py-12 sm:py-20' : 'py-8 sm:py-10',
                    isLarge && media && 'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
                )}
            >
                <div>
                    {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
                    <h1
                        className={cn(
                            'text-balance font-heading font-semibold text-foreground',
                            isLarge ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl',
                        )}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p
                            className={cn(
                                'mt-3 max-w-md text-muted-foreground',
                                isLarge ? 'text-base sm:text-lg' : 'text-sm',
                            )}
                        >
                            {subtitle}
                        </p>
                    )}
                    {actions && <div className="mt-6">{actions}</div>}
                </div>
                {isLarge && media && <div className="relative mx-auto w-full max-w-sm lg:max-w-none">{media}</div>}
            </div>
        </div>
    );
}
