import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import type { Payment } from '@/types/payment';

interface Props {
    payments: Payment[];
}

export default function AdminPaymentVerifications({ payments: initial }: Props) {
    const [payments, setPayments] = useState(initial);
    const [rejectTarget, setRejectTarget] = useState<Payment | null>(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState<number | null>(null);

    async function verify(payment: Payment) {
        setBusy(payment.id);
        try {
            await api.post(`/admin/payments/${payment.id}/verify`);
            setPayments((prev) => prev.filter((p) => p.id !== payment.id));
        } finally {
            setBusy(null);
        }
    }

    async function reject() {
        if (!rejectTarget) return;
        setBusy(rejectTarget.id);
        try {
            await api.post(`/admin/payments/${rejectTarget.id}/reject`, { rejection_reason: reason });
            setPayments((prev) => prev.filter((p) => p.id !== rejectTarget.id));
            setRejectTarget(null);
            setReason('');
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
                                <CardContent className="space-y-3 py-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                                        <a
                                            href={`/api/payments/${payment.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-primary underline"
                                        >
                                            View slip
                                        </a>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={busy === payment.id}
                                            onClick={() => verify(payment)}
                                        >
                                            Verify
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={busy === payment.id}
                                            onClick={() => setRejectTarget(payment)}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={rejectTarget !== null} onOpenChange={(open) => !open && setRejectTarget(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject payment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="rejection_reason">Reason</Label>
                            <Textarea
                                id="rejection_reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="destructive" disabled={!reason} onClick={reject}>
                                Reject
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
