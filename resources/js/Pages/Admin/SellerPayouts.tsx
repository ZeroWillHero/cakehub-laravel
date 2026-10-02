import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminLayout from '@/Layouts/AdminLayout';
import FileDropzone from '@/components/shared/FileDropzone';
import SelectedFile from '@/components/shared/SelectedFile';
import SlipPreviewDialog from '@/components/shared/SlipPreviewDialog';
import Spinner from '@/components/shared/Spinner';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { SLIP_RULE } from '@/lib/files';
import { statusTone } from '@/lib/statusTone';
import type { SellerPayout, SellerPayoutStatus } from '@/types/sellerPayout';

interface Props {
    payouts: SellerPayout[];
}

const statusLabel: Record<SellerPayoutStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    confirmed: 'Confirmed by seller',
};

export default function AdminSellerPayouts({ payouts: initial }: Props) {
    const [payouts, setPayouts] = useState(initial);
    const [payTarget, setPayTarget] = useState<SellerPayout | null>(null);
    const [previewTarget, setPreviewTarget] = useState<SellerPayout | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function closePayDialog() {
        setPayTarget(null);
        setFile(null);
        setError(null);
    }

    async function markPaid() {
        if (!payTarget || !file) return;
        setBusy(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('slip', file);
            const updated = await api.upload<SellerPayout>(
                `/admin/seller-payouts/${payTarget.id}/mark-paid`,
                formData,
            );
            setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            closePayDialog();
        } catch (err) {
            setError(errorMessage(err, 'slip', "We couldn't save this payout. Please try again."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AdminLayout breadcrumb={['Seller Payouts']}>
            <div className="mx-auto w-full max-w-3xl space-y-6">
                <h1 className="text-2xl font-semibold">Seller payouts</h1>

                {payouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payouts yet.</p>
                ) : (
                    <div className="space-y-3">
                        {payouts.map((payout) => (
                            <Card key={payout.id}>
                                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                                    <div>
                                        <p className="font-medium">
                                            {payout.seller?.business_name} — Order #{payout.order_id} — $
                                            {payout.amount.toFixed(2)}
                                        </p>
                                        {payout.has_slip && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto p-0 text-sm"
                                                onClick={() => setPreviewTarget(payout)}
                                            >
                                                View slip
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={statusTone(payout.status)}>
                                            {statusLabel[payout.status]}
                                        </Badge>
                                        {payout.status === 'pending' && (
                                            <Button type="button" size="sm" onClick={() => setPayTarget(payout)}>
                                                Mark paid
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={payTarget !== null} onOpenChange={(open) => !open && closePayDialog()}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Mark payout as paid</DialogTitle>
                        </DialogHeader>
                        {payTarget && (
                            <p className="text-sm text-muted-foreground">
                                Upload the bank slip for the ${payTarget.amount.toFixed(2)} transfer to{' '}
                                <span className="font-medium text-foreground">{payTarget.seller?.business_name}</span>{' '}
                                (Order #{payTarget.order_id}). The seller will be able to see it.
                            </p>
                        )}
                        {file ? (
                            <SelectedFile file={file} onClear={() => setFile(null)} disabled={busy} />
                        ) : (
                            <FileDropzone id="payout_slip" label="Upload payment slip" rule={SLIP_RULE} onFiles={([f]) => setFile(f)} />
                        )}
                        {error && (
                            <p className="text-sm text-destructive" role="alert">
                                {error}
                            </p>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closePayDialog} disabled={busy}>
                                Cancel
                            </Button>
                            <Button type="button" disabled={!file || busy} onClick={markPaid}>
                                {busy && <Spinner className="mr-2" />}
                                {busy ? 'Saving…' : 'Mark paid'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <SlipPreviewDialog
                    open={previewTarget !== null}
                    onOpenChange={(open) => !open && setPreviewTarget(null)}
                    slipUrl={previewTarget ? `/api/seller/payouts/${previewTarget.id}` : ''}
                    title="Payout slip"
                />
            </div>
        </AdminLayout>
    );
}
