import { useState } from 'react';
import { RotateCcw, Star, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import FileDropzone from '@/components/shared/FileDropzone';
import ImageLightbox from '@/components/shared/ImageLightbox';
import ProgressBar from '@/components/shared/ProgressBar';
import SmartImage from '@/components/shared/SmartImage';
import { IMAGE_RULE } from '@/lib/files';
import type { ProductImage } from '@/types/product';

export interface PendingPhoto {
    key: string;
    file: File;
    previewUrl: string;
    /** null = waiting, 0–100 = uploading. */
    progress: number | null;
    error: string | null;
}

interface Props {
    images: ProductImage[];
    pending: PendingPhoto[];
    /** True on "Add product" — photos wait until the product is saved. */
    deferred: boolean;
    disabled?: boolean;
    onAdd: (files: File[]) => void;
    onRemoveSaved: (image: ProductImage) => Promise<void>;
    onRemovePending: (key: string) => void;
    onRetry: (key: string) => void;
}

function RemoveButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger
                className="absolute right-1.5 top-1.5 inline-flex size-10 items-center justify-center rounded-full bg-background/95 text-destructive shadow-md hover:bg-background"
                aria-label={label}
            >
                <Trash2 className="size-4" aria-hidden="true" />
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Customers will no longer see it on your product page. You can add it again later.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep photo</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onConfirm}>
                        Remove photo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Photo grid for a product listing: big tappable tiles, a "Main photo"
 * badge on the first one (it's what customers see first), a per-photo
 * progress bar while uploading, retry on failure, confirm before removing,
 * and tap any saved photo to see it full size.
 */
export default function ProductPhotoManager({
    images,
    pending,
    deferred,
    disabled = false,
    onAdd,
    onRemoveSaved,
    onRemovePending,
    onRetry,
}: Props) {
    const [viewing, setViewing] = useState<number | null>(null);
    const [removeError, setRemoveError] = useState<string | null>(null);
    const total = images.length + pending.length;

    async function removeSaved(image: ProductImage) {
        setRemoveError(null);
        try {
            await onRemoveSaved(image);
        } catch {
            setRemoveError("We couldn't remove that photo. Please try again.");
        }
    }

    return (
        <div className="space-y-4">
            {total > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Product photos">
                    {images.map((image, i) => (
                        <li key={image.id} className="relative">
                            <button
                                type="button"
                                onClick={() => setViewing(i)}
                                className="block w-full cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                aria-label={`View photo ${i + 1} full size`}
                            >
                                <SmartImage src={image.url} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-xl border" />
                            </button>
                            {i === 0 && (
                                <span className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
                                    <Star className="size-3 fill-current" aria-hidden="true" />
                                    Main photo
                                </span>
                            )}
                            <RemoveButton label={`Remove photo ${i + 1}`} onConfirm={() => removeSaved(image)} />
                        </li>
                    ))}

                    {pending.map((photo, i) => {
                        const isMain = images.length === 0 && i === 0;
                        return (
                            <li key={photo.key} className="relative">
                                <img
                                    src={photo.previewUrl}
                                    alt={`New photo: ${photo.file.name}`}
                                    className="aspect-square w-full rounded-xl border object-cover"
                                />
                                <div className="absolute inset-0 flex flex-col justify-end gap-1.5 rounded-xl bg-gradient-to-t from-black/75 via-black/20 to-transparent p-2 text-xs text-white">
                                    {photo.error ? (
                                        <>
                                            <span className="font-medium">Upload failed</span>
                                            <button
                                                type="button"
                                                onClick={() => onRetry(photo.key)}
                                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-white px-2 font-medium text-black"
                                            >
                                                <RotateCcw className="size-3.5" aria-hidden="true" />
                                                Try again
                                            </button>
                                        </>
                                    ) : photo.progress !== null ? (
                                        <>
                                            <span className="font-medium">Uploading… {photo.progress}%</span>
                                            <ProgressBar value={photo.progress} label={`Uploading ${photo.file.name}`} />
                                        </>
                                    ) : (
                                        <span className="font-medium">
                                            {deferred ? (isMain ? 'Main photo · uploads when you save' : 'Uploads when you save') : 'Waiting to upload…'}
                                        </span>
                                    )}
                                </div>
                                {photo.progress === null && (
                                    <button
                                        type="button"
                                        onClick={() => onRemovePending(photo.key)}
                                        className="absolute right-1.5 top-1.5 inline-flex size-10 items-center justify-center rounded-full bg-background/95 text-destructive shadow-md hover:bg-background"
                                        aria-label={`Remove ${photo.file.name}`}
                                    >
                                        <Trash2 className="size-4" aria-hidden="true" />
                                    </button>
                                )}
                                {photo.error && <p className="mt-1 text-xs text-destructive">{photo.error}</p>}
                            </li>
                        );
                    })}
                </ul>
            )}

            <FileDropzone
                id="image-upload"
                label={total === 0 ? 'Add product photos' : 'Add more photos'}
                rule={IMAGE_RULE}
                multiple
                compact={total > 0}
                disabled={disabled}
                onFiles={onAdd}
                hint={total === 0 ? 'Tip: clear, bright photos sell better. The first photo becomes the main photo.' : undefined}
            />
            {removeError && (
                <p className="text-sm text-destructive" role="alert">
                    {removeError}
                </p>
            )}

            <ImageLightbox
                images={images.map((image, i) => ({ src: image.url, alt: `Photo ${i + 1}` }))}
                index={viewing}
                onIndexChange={setViewing}
            />
        </div>
    );
}
