import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImageUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FileDropzone from '@/components/shared/FileDropzone';
import ImageLightbox from '@/components/shared/ImageLightbox';
import ProgressBar from '@/components/shared/ProgressBar';
import SmartImage from '@/components/shared/SmartImage';
import { errorMessage } from '@/lib/errors';
import { IMAGE_RULE, validateFile } from '@/lib/files';
import { cn } from '@/lib/utils';

interface Props {
    label: string;
    /** Current saved image, if any. */
    url: string | null;
    /** Sends the file; resolves to the new saved URL. */
    upload: (file: File, onProgress: (percent: number) => void) => Promise<string | null>;
    /** Frame shape, e.g. 'aspect-square' or 'aspect-video'. */
    aspect?: string;
    hint?: string;
    className?: string;
}

/**
 * Single-photo field (store logo, cover photo). Shows the current photo
 * large enough to judge, a clear "Change photo" button, an instant local
 * preview with a progress bar while uploading, and a "Saved" confirmation.
 */
export default function ImageUploadField({ label, url: initialUrl, upload, aspect = 'aspect-video', hint, className }: Props) {
    const [url, setUrl] = useState(initialUrl);
    const [preview, setPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [justSaved, setJustSaved] = useState(false);
    const [viewing, setViewing] = useState(false);
    const changeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);

    async function handle(file: File) {
        const problem = validateFile(file, IMAGE_RULE);
        if (problem) {
            setError(problem);
            return;
        }
        setError(null);
        setJustSaved(false);
        setPreview(URL.createObjectURL(file));
        setProgress(0);
        try {
            const saved = await upload(file, setProgress);
            setUrl(saved);
            setJustSaved(true);
        } catch (err) {
            setError(errorMessage(err, 'image', "We couldn't upload that photo. Please try again."));
        } finally {
            setPreview(null);
            setProgress(null);
        }
    }

    const uploading = progress !== null;
    const shown = preview ?? url;

    return (
        <div className={cn('space-y-2', className)}>
            <p className="text-sm font-medium">{label}</p>

            {shown ? (
                <>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => !uploading && url && setViewing(true)}
                            className="block w-full cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            aria-label={`View ${label.toLowerCase()} larger`}
                            disabled={uploading}
                        >
                            <SmartImage src={shown} alt={label} loading="eager" className={cn('w-full rounded-xl border', aspect)} />
                        </button>
                        {uploading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/50 px-6 text-white">
                                <span className="text-sm font-medium">Uploading… {progress}%</span>
                                <ProgressBar value={progress} label={`Uploading ${label.toLowerCase()}`} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11"
                            disabled={uploading}
                            onClick={() => changeInputRef.current?.click()}
                        >
                            <ImageUp aria-hidden="true" />
                            Change {label.toLowerCase()}
                        </Button>
                        {justSaved && !uploading && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400" role="status">
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                                Saved
                            </span>
                        )}
                        <input
                            ref={changeInputRef}
                            type="file"
                            accept={IMAGE_RULE.types.join(',')}
                            aria-label={`Change ${label.toLowerCase()}`}
                            className="sr-only"
                            tabIndex={-1}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handle(file);
                                e.target.value = '';
                            }}
                        />
                    </div>
                    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                    {error && (
                        <p className="text-sm text-destructive" role="alert">
                            {error}
                        </p>
                    )}
                </>
            ) : (
                <FileDropzone label={`Add ${label.toLowerCase()}`} rule={IMAGE_RULE} onFiles={([file]) => handle(file)} hint={hint} error={error} />
            )}

            {url && <ImageLightbox images={[{ src: url, alt: label }]} index={viewing ? 0 : null} onIndexChange={(i) => setViewing(i !== null)} />}
        </div>
    );
}
