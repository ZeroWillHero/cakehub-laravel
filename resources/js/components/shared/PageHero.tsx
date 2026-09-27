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
// Warm cocoa sampled from the hero cake photography's backdrop, blended
// into the theme's primary/accent tokens so the hero background reads as
// one piece with both the brand color and the photo — not theme-agnostic
// by design, this gradient exists specifically to match that image. Kept
// light (low background-mix %) so it reads as a subtle wash/scrim over the
// actual hero photo (HERO_IMAGE), not a layer that hides it — the photo
// should be clearly visible edge to edge, corners included.
const HERO_GRADIENT = [
    'radial-gradient(1100px 480px at 12% 0%, color-mix(in oklab, var(--primary) 12%, transparent) 0%, transparent 60%)',
    'linear-gradient(135deg, color-mix(in oklab, var(--background) 30%, transparent) 0%, color-mix(in oklab, var(--accent) 30%, var(--background) 30%) 55%, color-mix(in oklab, #7c5a41 25%, var(--background) 30%) 100%)',
].join(', ');

const HERO_IMAGE = '/images/hero/hero.png';

export default function PageHero({ title, subtitle, actions, breadcrumb, media, size = 'sm', className }: Props) {
    const isLarge = size === 'lg';
    const centered = isLarge && !media;

    return (
        <div
            className={cn(
                'relative bg-cover bg-center bg-no-repeat',
                // Pulls the hero up behind the sticky, transparent SiteHeader
                // (h-16) so the background photo spans that strip too,
                // instead of leaving the page's plain background showing
                // through above the hero. pt-16 compensates so the title's
                // own position is unchanged.
                isLarge && '-mt-16 pt-16',
                className,
            )}
            style={
                isLarge
                    ? { backgroundImage: `${HERO_GRADIENT}, url(${HERO_IMAGE})` }
                    : undefined
            }
        >
            {isLarge && (
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background sm:h-32"
                    aria-hidden="true"
                />
            )}
            <div
                className={cn(
                    'mx-auto max-w-6xl px-4 sm:px-6 lg:px-8',
                    isLarge ? 'py-16 sm:py-24' : 'py-8 sm:py-10',
                    isLarge && media && 'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
                )}
            >
                <div className={centered ? 'mx-auto max-w-2xl text-center' : undefined}>
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
                                'mt-3 text-muted-foreground',
                                centered ? 'mx-auto max-w-md' : 'max-w-md',
                                isLarge ? 'text-base sm:text-lg' : 'text-sm',
                            )}
                        >
                            {subtitle}
                        </p>
                    )}
                    {actions && (
                        <div className={cn('mt-6', centered && 'flex justify-center')}>{actions}</div>
                    )}
                </div>
                {isLarge && media && <div className="relative mx-auto w-full max-w-sm lg:max-w-none">{media}</div>}
            </div>
        </div>
    );
}
