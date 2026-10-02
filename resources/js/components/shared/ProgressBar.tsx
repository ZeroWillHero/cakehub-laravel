import { cn } from '@/lib/utils';

interface Props {
    /** 0–100. */
    value: number;
    label: string;
    className?: string;
}

export default function ProgressBar({ value, label, className }: Props) {
    const clamped = Math.max(0, Math.min(100, value));
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clamped}
            className={cn('h-2 w-full overflow-hidden rounded-full bg-white/40 dark:bg-black/40', className)}
        >
            <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${clamped}%` }} />
        </div>
    );
}
