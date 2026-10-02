import { useState } from 'react';
import { Camera } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import Spinner from '@/components/shared/Spinner';
import { IMAGE_RULE, validateFile } from '@/lib/files';
import { cn } from '@/lib/utils';

interface Props {
    /** Used for the accessible name: "Upload image for {name}". */
    name: string;
    url: string | null;
    onUpload: (file: File) => Promise<void>;
    onInvalid: (message: string) => void;
    className?: string;
}

/**
 * Compact image control for list rows (admin categories/ads): a visible
 * thumbnail with a camera badge so it reads as "tap to change", a clear
 * "Add image"/"Change image" caption, and a spinner while uploading.
 */
export default function ImageThumbUpload({ name, url, onUpload, onInvalid, className }: Props) {
    const [uploading, setUploading] = useState(false);

    async function handle(file: File) {
        const problem = validateFile(file, IMAGE_RULE);
        if (problem) {
            onInvalid(problem);
            return;
        }
        setUploading(true);
        try {
            await onUpload(file);
        } finally {
            setUploading(false);
        }
    }

    return (
        <label className={cn('group flex shrink-0 cursor-pointer flex-col items-center gap-1', uploading && 'pointer-events-none', className)}>
            <span className="relative block size-16 rounded-lg has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
                <SmartImage src={url} alt="" fallbackLabel="" className="size-16 rounded-lg border" />
                <span className="absolute -bottom-1 -right-1 inline-flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow">
                    <Camera className="size-3" aria-hidden="true" />
                </span>
                {uploading && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white">
                        <Spinner size={20} />
                        <span className="sr-only">Uploading image</span>
                    </span>
                )}
                <input
                    type="file"
                    accept={IMAGE_RULE.types.join(',')}
                    aria-label={`Upload image for ${name}`}
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handle(file);
                        e.target.value = '';
                    }}
                />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                {uploading ? 'Uploading…' : url ? 'Change' : 'Add image'}
            </span>
        </label>
    );
}
