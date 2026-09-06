import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
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
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);

    async function markPaid() {
        if (!payTarget || !file) return;
        setBusy(true);
        try {
            const formData = new FormData();
            formData.append('slip', file);
            const updated = await api.upload<SellerPayout>(
                `/admin/seller-payouts/${payTarget.id}/mark-paid`,
                formData,
            );
            setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setPayTarget(null);
            setFile(null);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
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
                                            <a
                                                href={`/api/seller/payouts/${payout.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-primary underline"
                                            >
                                                View slip
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={payout.status === 'pending' ? 'secondary' : 'default'}>
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

                <Dialog open={payTarget !== null} onOpenChange={(open) => !open && setPayTarget(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mark payout as paid</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="payout_slip">Payment slip</Label>
                            <Input
                                id="payout_slip"
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" disabled={!file || busy} onClick={markPaid}>
                                Mark paid
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
