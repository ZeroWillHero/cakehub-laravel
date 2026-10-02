import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/Layouts/AdminLayout';
import SlipPreviewDialog from '@/components/shared/SlipPreviewDialog';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { api } from '@/lib/api';
import type { Payment } from '@/types/payment';

interface Props {
    payments: Payment[];
}

export default function AdminPaymentVerifications({ payments: initial }: Props) {
    const [payments, setPayments] = useState(initial);
    const [previewTarget, setPreviewTarget] = useState<Payment | null>(null);
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState<number | null>(null);

    function closePreview() {
        setPreviewTarget(null);
        setRejecting(false);
        setReason('');
    }

    async function verify(payment: Payment) {
        setBusy(payment.id);
        try {
            await api.post(`/admin/payments/${payment.id}/verify`);
            setPayments((prev) => prev.filter((p) => p.id !== payment.id));
            closePreview();
            toast.success('Payment approved.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't approve the payment."));
        } finally {
            setBusy(null);
        }
    }

    async function reject(payment: Payment) {
        setBusy(payment.id);
        try {
            await api.post(`/admin/payments/${payment.id}/reject`, { rejection_reason: reason });
            setPayments((prev) => prev.filter((p) => p.id !== payment.id));
            closePreview();
            toast.success('Payment declined.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't decline the payment."));
        } finally {
            setBusy(null);
        }
    }

    return (
        <AdminLayout breadcrumb={['Payment Verifications']}>
            <div className="mx-auto w-full max-w-3xl space-y-6">
                <h1 className="text-2xl font-semibold">Payment verifications</h1>

                {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments awaiting verification.</p>
                ) : (
                    <div className="space-y-3">
                        {payments.map((payment) => (
                            <Card key={payment.id}>
                                <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
                                    <div>
                                        <p className="font-medium">
                                            {payment.payable_type === 'order' ? 'Order' : 'Subscription'} #
                                            {payment.payable_id} — ${payment.amount.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Submitted by {payment.submitted_by?.name} into{' '}
                                            {payment.admin_bank_account?.bank_name}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPreviewTarget(payment)}
                                    >
                                        View slip
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <SlipPreviewDialog
                    open={previewTarget !== null}
                    onOpenChange={(open) => !open && closePreview()}
                    slipUrl={previewTarget ? `/api/payments/${previewTarget.id}` : ''}
                    title="Payment slip"
                >
                    {previewTarget && !rejecting && (
                        <>
                            <Button
                                type="button"
                                disabled={busy === previewTarget.id}
                                onClick={() => verify(previewTarget)}
                            >
                                Approve
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy === previewTarget.id}
                                onClick={() => setRejecting(true)}
                            >
                                Decline
                            </Button>
                        </>
                    )}
                    {previewTarget && rejecting && (
                        <div className="w-full space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="rejection_reason">Reason for declining</Label>
                                <Textarea
                                    id="rejection_reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={!reason || busy === previewTarget.id}
                                    onClick={() => reject(previewTarget)}
                                >
                                    Confirm decline
                                </Button>
                            </div>
                        </div>
                    )}
                </SlipPreviewDialog>
            </div>
        </AdminLayout>
    );
}
