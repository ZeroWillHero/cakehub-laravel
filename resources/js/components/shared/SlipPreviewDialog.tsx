import { type ReactNode, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slipUrl: string;
    title?: string;
    /** Action buttons (e.g. Approve/Decline) rendered in the footer. */
    children?: ReactNode;
}

/**
 * Shows a payment/payout slip in a modal instead of opening it in a new tab.
 * Slips can be an image or a PDF (see SubmitPaymentSlipRequest's mimes rule)
 * — defaults to <img>, falling back to an <iframe> if the browser can't
 * render the response as an image (e.g. it's a PDF).
 */
export default function SlipPreviewDialog({ open, onOpenChange, slipUrl, title = 'Payment slip', children }: Props) {
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) setImageFailed(false);
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-auto rounded-lg border bg-muted/30">
                    {imageFailed ? (
                        <iframe src={slipUrl} title={title} className="h-[60vh] w-full" />
                    ) : (
                        <img
                            src={slipUrl}
                            alt={title}
                            className="w-full object-contain"
                            onError={() => setImageFailed(true)}
                        />
                    )}
                </div>
                {children && <DialogFooter>{children}</DialogFooter>}
            </DialogContent>
        </Dialog>
    );
}
