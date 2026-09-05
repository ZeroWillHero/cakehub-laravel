import { useState } from 'react';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
import { cn } from '@/lib/utils';

interface Props {
    src: string;
    alt: string;
    label?: string;
    className?: string;
}

/**
 * Renders real photography at `src`, falling back to `ImagePlaceholder` if
 * the asset hasn't been supplied yet (404) — drop the file at the given
 * `src` path under `public/` to swap in real imagery with no code change.
 */
export default function HeroImage({ src, alt, label, className }: Props) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return <ImagePlaceholder label={label ?? alt} className={className} />;
    }

    return (
        <img
            src={src}
            alt={alt}
            onError={() => setFailed(true)}
            className={cn('object-contain', className)}
        />
    );
}
