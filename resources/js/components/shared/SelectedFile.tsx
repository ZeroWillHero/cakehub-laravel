import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, X } from 'lucide-react';
import { formatBytes, isImageFile } from '@/lib/files';

interface Props {
    file: File;
    onClear: () => void;
    disabled?: boolean;
}

/**
 * Confirms which file was picked before it's sent: a preview for photos
 * (so a wrong screenshot is caught early), the name and size, and a way to
 * pick a different one.
 */
export default function SelectedFile({ file, onClear, disabled = false }: Props) {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!isImageFile(file)) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
            {preview ? (
                <img src={preview} alt="Selected file preview" className="size-16 shrink-0 rounded-lg border object-cover" />
            ) : (
                <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-lg border bg-background">
                    <FileText className="size-6 text-muted-foreground" aria-hidden="true" />
                </span>
            )}
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                    <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                    <span className="truncate">{file.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · ready to send</p>
            </div>
            <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
                <X className="size-4" aria-hidden="true" />
                Change
            </button>
        </div>
    );
}
