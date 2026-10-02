import type { ReactNode } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { buttonVariants } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { HERO_IMAGE } from '@/components/shared/PageHero';
import { cn } from '@/lib/utils';
import type { Ad } from '@/types/ad';

interface Props {
    ads: Ad[];
    rotationSeconds: number;
    /** Shown once, fixed over the carousel — the ads slide underneath it. */
    actions?: ReactNode;
}

function backgroundFor(ad: Ad): string {
    // The default hero photo sits underneath as a fallback layer: it only
    // shows when the ad has no image or its image fails to load.
    const layers = ad.image_url ? [ad.image_url, HERO_IMAGE] : [HERO_IMAGE];
    return layers.map((url) => `url(${JSON.stringify(url)})`).join(', ');
}

/**
 * The homepage hero when any ads are live: each ad is a full-width hero
 * slide — its image as the background, its name as the title and its
 * description as the subtitle, centered like the default PageHero. Rotation
 * matches the old banner carousel (infinite, right-to-left, one at a time,
 * at the admin-set interval). With no ads, Home falls back to PageHero.
 */
export default function HeroAdsCarousel({ ads, rotationSeconds, actions }: Props) {
    if (ads.length === 0) return null;

    return (
        // -mt-16 pulls the hero up behind the sticky, transparent SiteHeader
        // (h-16), same as PageHero size="lg"; each slide's pt-16 compensates.
        <div className="relative -mt-16">
            {/*
              * Embla's default direction is what gives the right-to-left motion
              * (each next ad slides in from the right). `direction: 'rtl'` is
              * for right-to-left *documents* — on this LTR page it scrolled the
              * track the wrong way and left the hero blank after one rotation.
              */}
            <Carousel
                opts={{ loop: true }}
                plugins={[Autoplay({ delay: rotationSeconds * 1000, stopOnInteraction: false })]}
                aria-label="Featured promotions"
            >
                {/* Zero the primitive's multi-item gutters so each slide fills the hero edge to edge. */}
                <CarouselContent className="ml-0">
                    {ads.map((ad, index) => (
                        <CarouselItem
                            key={ad.id}
                            aria-label={`${index + 1} of ${ads.length}`}
                            className="relative basis-full bg-cover bg-center bg-no-repeat pl-0"
                            style={{ backgroundImage: backgroundFor(ad) }}
                        >
                            {/* Dark scrim — ad photos can be any brightness, so white copy needs a guaranteed contrast floor. */}
                            <div className="pointer-events-none absolute inset-0 bg-black/50" aria-hidden="true" />
                            <div
                                className={cn(
                                    'relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 pt-32 text-center sm:px-6 sm:pt-40 lg:px-8',
                                    // Leaves room for the fixed actions overlay below the copy.
                                    actions ? 'pb-56 sm:pb-64' : 'pb-24 sm:pb-32',
                                )}
                            >
                                <h2 className="text-balance font-heading text-4xl font-semibold text-white sm:text-5xl">
                                    {ad.name}
                                </h2>
                                {ad.description && (
                                    <p className="mx-auto mt-3 line-clamp-3 max-w-md text-base text-white/90 sm:text-lg">
                                        {ad.description}
                                    </p>
                                )}
                                {ad.link_url && (
                                    <a
                                        href={ad.link_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`Learn more about ${ad.name} (opens in a new tab)`}
                                        className={cn(
                                            buttonVariants({ variant: 'link' }),
                                            'mt-2 min-h-11 text-white underline underline-offset-4',
                                        )}
                                    >
                                        Learn more
                                    </a>
                                )}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Bottom fade blends the hero into the page; the header stays fully transparent over the photo. */}
            <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background sm:h-32"
                aria-hidden="true"
            />

            {actions && (
                <div className="absolute inset-x-0 bottom-24 flex justify-center px-4 sm:bottom-32">{actions}</div>
            )}
        </div>
    );
}
