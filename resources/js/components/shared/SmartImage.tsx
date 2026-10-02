import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'className'> {
    src: string | null | undefined;
    alt: string;
    /** Sizing/shape for the frame (aspect ratio, width, rounding). */
    className?: string;
    /** Extra classes for the <img> itself, e.g. object-contain. */
    imgClassName?: string;
    /** Text under the icon when there's no image or it fails to load. */
    fallbackLabel?: string;
}

/**
 * The one way to show a remote photo. Reserves the image's space up front
 * (no layout jump), shows a soft shimmer while it downloads, fades the
 * photo in once ready, and swaps to a friendly "no photo" tile instead of
 * the browser's broken-image icon when the URL is missing or fails.
 */
export default function SmartImage({
    src,
    alt,
    className,
    imgClassName,
    fallbackLabel,
    loading = 'lazy',
    ...imgProps
}: Props) {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        setStatus(src ? 'loading' : 'error');
    }, [src]);

    // A cached image can finish before React attaches onLoad.
    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
            setStatus('loaded');
        }
    }, [src]);

    return (
        <div className={cn('relative overflow-hidden bg-muted', className)}>
            {status !== 'error' && src && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    loading={loading}
                    decoding="async"
                    onLoad={() => setStatus('loaded')}
                    onError={() => setStatus('error')}
                    className={cn(
                        'h-full w-full object-cover transition-opacity duration-300',
                        status === 'loaded' ? 'opacity-100' : 'opacity-0',
                        imgClassName,
                    )}
                    {...imgProps}
                />
            )}

            {status === 'loading' && (
                <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-accent to-muted" />
            )}

            {status === 'error' && (
                <div
                    role="img"
                    aria-label={alt}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center text-muted-foreground"
                >
                    <ImageOff className="size-6 opacity-60" aria-hidden="true" />
                    {fallbackLabel !== '' && (
                        <span className="line-clamp-2 text-xs opacity-80">{fallbackLabel ?? 'No photo yet'}</span>
                    )}
                </div>
            )}
        </div>
    );
}
