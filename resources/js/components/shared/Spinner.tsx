import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
    size?: number;
}

export default function Spinner({ className, size = 16 }: Props) {
    return <Loader2 className={cn('animate-spin', className)} size={size} aria-hidden="true" />;
}
