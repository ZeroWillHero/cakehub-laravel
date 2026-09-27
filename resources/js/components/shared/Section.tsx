import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    children: ReactNode;
    title?: string;
    description?: string;
    className?: string;
    as?: 'section' | 'div';
}

/**
 * Consistent page-section wrapper: outer vertical rhythm + inner max-width
 * gutter, with an optional title/description header row.
 */
export default function Section({ children, title, description, className, as = 'section' }: Props) {
    const Tag: ElementType = as;

    return (
        <Tag className={cn('py-12 sm:py-16', className)}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {title && (
                    <div className="mb-6">
                        <h2 className="font-heading text-xl font-semibold sm:text-2xl">{title}</h2>
                        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                    </div>
                )}
                {children}
            </div>
        </Tag>
    );
}
