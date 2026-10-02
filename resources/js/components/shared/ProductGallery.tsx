import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import ImageLightbox from '@/components/shared/ImageLightbox';
import SmartImage from '@/components/shared/SmartImage';
import { cn } from '@/lib/utils';

interface Props {
    images: { id: number; url: string }[];
    name: string;
    className?: string;
}

/**
 * Product photo viewer: one large photo, thumbnails underneath when there
 * are several, arrows to step through them, and tap/click to open the
 * full-screen viewer for a closer look.
 */
export default function ProductGallery({ images, name, className }: Props) {
    const [active, setActive] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const hasMany = images.length > 1;

    if (images.length === 0) {
        return <SmartImage src={null} alt={name} fallbackLabel="No photos yet" className={cn('aspect-square w-full rounded-2xl', className)} />;
    }

    const lightboxImages = images.map((image, i) => ({ src: image.url, alt: `${name} — photo ${i + 1}` }));

    return (
        <div className={cn('space-y-3', className)}>
            <div className="group relative">
                <button
                    type="button"
                    onClick={() => setLightboxIndex(active)}
                    className="block w-full cursor-zoom-in rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={`Enlarge photo ${active + 1} of ${name}`}
                >
                    <SmartImage
                        src={images[active].url}
                        alt={hasMany ? `${name} — photo ${active + 1}` : name}
                        loading="eager"
                        className="aspect-square w-full rounded-2xl"
                    />
                    <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
                        <Expand className="size-3.5" aria-hidden="true" />
                        Tap to enlarge
                    </span>
                </button>

                {hasMany && (
                    <>
                        <button
                            type="button"
                            onClick={() => setActive((active - 1 + images.length) % images.length)}
                            className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md hover:bg-background"
                            aria-label="Previous photo"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setActive((active + 1) % images.length)}
                            className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md hover:bg-background"
                            aria-label="Next photo"
                        >
                            <ChevronRight className="size-5" />
                        </button>
                        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                            {active + 1} / {images.length}
                        </span>
                    </>
                )}
            </div>

            {hasMany && (
                <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Product photos">
                    {images.map((image, i) => (
                        <li key={image.id} className="shrink-0">
                            <button
                                type="button"
                                onClick={() => setActive(i)}
                                aria-label={`Show photo ${i + 1}`}
                                aria-current={i === active}
                                className={cn(
                                    'block size-16 overflow-hidden rounded-lg border-2 transition',
                                    i === active ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                                )}
                            >
                                <SmartImage src={image.url} alt="" fallbackLabel="" className="size-full" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <ImageLightbox images={lightboxImages} index={lightboxIndex} onIndexChange={setLightboxIndex} />
        </div>
    );
}
