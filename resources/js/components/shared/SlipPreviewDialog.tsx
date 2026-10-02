import { type ReactNode, useState } from 'react';
import { ExternalLink, FileX2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Spinner from '@/components/shared/Spinner';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slipUrl: string;
    title?: string;
    /** Action buttons (e.g. Approve/Decline) rendered in the footer. */
    children?: ReactNode;
}

/**
 * Shows a payment/payout slip (or verification document) in a modal
 * instead of opening it in a new tab. Files can be an image or a PDF —
 * defaults to <img>, falling back to an <iframe> if the browser can't
 * render the response as an image (e.g. it's a PDF). Includes a loading
 * indicator, zoom for reading small print on receipts, and an "Open in new
 * tab" escape hatch.
 */
export default function SlipPreviewDialog({ open, onOpenChange, slipUrl, title = 'Payment slip', children }: Props) {
    const [imageFailed, setImageFailed] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [zoomed, setZoomed] = useState(false);
    const [missing, setMissing] = useState(false);

    // The image failed: it's either a PDF (show it in an iframe) or the file
    // is gone. Ask the server which, without downloading it — the document
    // route returns 404 for a missing file and a redirect otherwise.
    function handleImageError() {
        setImageFailed(true);
        fetch(slipUrl, { method: 'HEAD', redirect: 'manual', credentials: 'include' })
            .then((response) => {
                if (response.status === 404 || response.status === 410) setMissing(true);
            })
            .catch(() => {});
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    setImageFailed(false);
                    setMissing(false);
                    setLoaded(false);
                    setZoomed(false);
                }
                onOpenChange(next);
            }}
        >
            <DialogContent className="flex max-h-[95dvh] flex-col sm:max-w-3xl">
                <DialogHeader className="pr-8">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    {!imageFailed && !missing && (
                        <Button type="button" variant="outline" size="sm" className="min-h-9" onClick={() => setZoomed((z) => !z)}>
                            {zoomed ? <ZoomOut aria-hidden="true" /> : <ZoomIn aria-hidden="true" />}
                            {zoomed ? 'Fit to screen' : 'Zoom in'}
                        </Button>
                    )}
                    {!missing && (
                        <a
                            href={slipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            <ExternalLink className="size-4" aria-hidden="true" />
                            Open in new tab
                        </a>
                    )}
                </div>

                <div className="relative min-h-64 flex-1 overflow-auto rounded-lg border bg-muted/30">
                    {!loaded && !imageFailed && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Spinner size={28} />
                            Loading…
                        </div>
                    )}
                    {missing ? (
                        <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 p-6 text-center" role="alert">
                            <FileX2 className="size-10 text-muted-foreground" aria-hidden="true" />
                            <p className="font-medium">This file can&apos;t be found</p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                It may have been removed from storage. Please ask for it to be uploaded again.
                            </p>
                        </div>
                    ) : imageFailed ? (
                        <iframe src={slipUrl} title={title} className="h-[65dvh] w-full" />
                    ) : (
                        <img
                            src={slipUrl}
                            alt={title}
                            onLoad={() => setLoaded(true)}
                            onError={handleImageError}
                            onClick={() => setZoomed((z) => !z)}
                            className={cn(
                                'mx-auto transition-opacity',
                                loaded ? 'opacity-100' : 'opacity-0',
                                zoomed ? 'max-w-none cursor-zoom-out' : 'max-h-[65dvh] w-auto max-w-full cursor-zoom-in object-contain',
                            )}
                        />
                    )}
                </div>
                {children && <DialogFooter>{children}</DialogFooter>}
            </DialogContent>
        </Dialog>
    );
}
