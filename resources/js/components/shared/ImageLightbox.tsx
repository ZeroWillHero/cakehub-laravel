import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Spinner from '@/components/shared/Spinner';
import { cn } from '@/lib/utils';

export interface LightboxImage {
    src: string;
    alt: string;
}

interface Props {
    images: LightboxImage[];
    /** Index of the image to show, or null when closed. */
    index: number | null;
    onIndexChange: (index: number | null) => void;
}

/**
 * Full-screen photo viewer: big close button, previous/next arrows,
 * keyboard arrows, swipe on phones, tap-to-zoom, and an "n of m" counter so
 * it's always clear there are more photos.
 */
export default function ImageLightbox({ images, index, onIndexChange }: Props) {
    const open = index !== null && images.length > 0;
    const current = open ? images[index] : null;
    const [zoomed, setZoomed] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [origin, setOrigin] = useState('50% 50%');
    const swipeStart = useRef<number | null>(null);
    const hasMany = images.length > 1;

    useEffect(() => {
        setZoomed(false);
        setLoaded(false);
    }, [index]);

    function go(step: number) {
        if (index === null) return;
        onIndexChange((index + step + images.length) % images.length);
    }

    useEffect(() => {
        if (!open || !hasMany) return;
        function onKey(event: KeyboardEvent) {
            if (event.key === 'ArrowRight') go(1);
            if (event.key === 'ArrowLeft') go(-1);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    function toggleZoom(event: ReactPointerEvent<HTMLImageElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        setOrigin(
            `${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
        setZoomed((z) => !z);
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onIndexChange(null)}>
            <DialogContent
                showCloseButton={false}
                className="flex h-[100dvh] max-h-none w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-black/95 p-0 text-white ring-0 sm:max-w-none"
            >
                <DialogTitle className="sr-only">{current?.alt ?? 'Photo'}</DialogTitle>

                <div className="flex items-center justify-between gap-2 p-3">
                    <span className="min-w-0 truncate text-sm text-white/80" aria-live="polite">
                        {hasMany && index !== null ? `Photo ${index + 1} of ${images.length}` : current?.alt}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setZoomed((z) => !z)}
                            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
                            aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                        >
                            {zoomed ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => onIndexChange(null)}
                            className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                            aria-label="Close photo viewer"
                        >
                            <X className="size-6" />
                        </button>
                    </div>
                </div>

                <div
                    className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2"
                    onTouchStart={(e) => (swipeStart.current = e.touches[0].clientX)}
                    onTouchEnd={(e) => {
                        if (swipeStart.current === null || zoomed || !hasMany) return;
                        const dx = e.changedTouches[0].clientX - swipeStart.current;
                        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
                        swipeStart.current = null;
                    }}
                >
                    {!loaded && (
                        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                            <Spinner size={32} className="text-white/70" />
                        </div>
                    )}
                    {current && (
                        <img
                            key={current.src}
                            src={current.src}
                            alt={current.alt}
                            onLoad={() => setLoaded(true)}
                            onError={() => setLoaded(true)}
                            onClick={toggleZoom}
                            style={{ transformOrigin: origin }}
                            className={cn(
                                'max-h-full max-w-full select-none object-contain transition-[transform,opacity] duration-300',
                                loaded ? 'opacity-100' : 'opacity-0',
                                zoomed ? 'scale-[2.2] cursor-zoom-out' : 'cursor-zoom-in',
                            )}
                            draggable={false}
                        />
                    )}

                    {hasMany && (
                        <>
                            <button
                                type="button"
                                onClick={() => go(-1)}
                                className="absolute left-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                                aria-label="Previous photo"
                            >
                                <ChevronLeft className="size-7" />
                            </button>
                            <button
                                type="button"
                                onClick={() => go(1)}
                                className="absolute right-2 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                                aria-label="Next photo"
                            >
                                <ChevronRight className="size-7" />
                            </button>
                        </>
                    )}
                </div>

                {hasMany && (
                    <div className="flex justify-center gap-2 overflow-x-auto p-3">
                        {images.map((image, i) => (
                            <button
                                key={image.src}
                                type="button"
                                onClick={() => onIndexChange(i)}
                                aria-label={`Show photo ${i + 1}`}
                                aria-current={i === index}
                                className={cn(
                                    'size-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity',
                                    i === index ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-100',
                                )}
                            >
                                <img src={image.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
