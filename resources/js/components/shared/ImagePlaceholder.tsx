import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    label?: string;
    className?: string;
}

/**
 * Stands in for real (eventually AI-generated) cake/bakery photography.
 * Swap for an actual <img> once imagery is supplied — see
 * docs/skills/frontend-design-skill.md.
 */
export default function ImagePlaceholder({ label = 'Image', className }: Props) {
    return (
        <div
            role="img"
            aria-label={label}
            className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-accent/40 text-accent-foreground',
                className,
            )}
        >
            <ImageIcon className="size-8 opacity-50" aria-hidden="true" />
            <span className="text-xs opacity-70">{label}</span>
        </div>
    );
}
