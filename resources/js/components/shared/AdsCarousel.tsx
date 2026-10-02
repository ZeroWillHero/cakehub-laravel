import type { ElementType, ReactNode } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import SmartImage from '@/components/shared/SmartImage';
import { cn } from '@/lib/utils';
import type { Ad } from '@/types/ad';

interface Props {
    ads: Ad[];
    rotationSeconds: number;
}

function AdSlide({ ad, children }: { ad: Ad; children: ReactNode }) {
    const Tag: ElementType = ad.link_url ? 'a' : 'div';
    const linkProps = ad.link_url ? { href: ad.link_url, target: '_blank', rel: 'noreferrer' } : {};

    return (
        <Tag
            {...linkProps}
            className={cn('relative block overflow-hidden rounded-3xl', ad.link_url && 'cursor-pointer')}
            aria-label={ad.link_url ? `${ad.name} — opens ${ad.link_url}` : undefined}
        >
            {children}
        </Tag>
    );
}

/**
 * Auto-rotating ad carousel — takes over the homepage's "current carousel
 * place" (the cake-photo marquee) whenever any ads exist; the marquee only
 * shows again once there are none. Slightly narrower than the page's normal
 * max-width gutter (see the max-w-4xl wrapper on Home.tsx) and taller than
 * a typical section, so it reads as a distinct banner rather than blending
 * into the surrounding content width.
 */
export default function AdsCarousel({ ads, rotationSeconds }: Props) {
    if (ads.length === 0) return null;

    return (
        <Carousel
            opts={{ loop: true, direction: 'rtl' }}
            plugins={[Autoplay({ delay: rotationSeconds * 1000, stopOnInteraction: false })]}
            className="w-full"
        >
            {/*
              * The shadcn Carousel primitive's default gap classes (-ml-4 on
              * the track, pl-4 per item) are meant for multi-item carousels
              * with visible neighboring slides. With a single full-width
              * slide, that combination clips ~1rem off the right edge
              * instead of the banner filling its placeholder — override
              * both back to zero here.
              */}
            <CarouselContent className="ml-0">
                {ads.map((ad) => (
                    <CarouselItem key={ad.id} className="basis-full pl-0">
                        <AdSlide ad={ad}>
                            {ad.image_url ? (
                                <SmartImage
                                    src={ad.image_url}
                                    alt={ad.name}
                                    loading="eager"
                                    fallbackLabel=""
                                    className="h-56 w-full sm:h-72 md:h-96"
                                />
                            ) : (
                                <div className="flex h-40 w-full items-center justify-center bg-muted sm:h-56 md:h-64">
                                    <span className="text-sm text-muted-foreground">{ad.name}</span>
                                </div>
                            )}
                            {(ad.name || ad.description) && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white sm:p-5">
                                    <p className="font-heading text-lg font-semibold sm:text-xl">{ad.name}</p>
                                    {ad.description && (
                                        <p className="mt-1 line-clamp-1 text-sm text-white/90">{ad.description}</p>
                                    )}
                                </div>
                            )}
                        </AdSlide>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
