import { Star } from 'lucide-react';

interface Props {
    value: number;
    onChange?: (value: number) => void;
    size?: number;
}

export default function RatingStars({ value, onChange, size = 18 }: Props) {
    const interactive = Boolean(onChange);

    return (
        <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onChange?.(star)}
                    className={interactive ? 'cursor-pointer' : 'cursor-default'}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    aria-pressed={interactive ? star <= value : undefined}
                >
                    <Star
                        size={size}
                        className={star <= value ? 'fill-primary text-primary' : 'fill-none text-muted-foreground'}
                    />
                </button>
            ))}
        </div>
    );
}
