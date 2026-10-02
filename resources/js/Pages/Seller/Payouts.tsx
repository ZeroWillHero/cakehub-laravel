import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SellerLayout from '@/Layouts/SellerLayout';
import SlipPreviewDialog from '@/components/shared/SlipPreviewDialog';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { api } from '@/lib/api';
import type { SellerPayout, SellerPayoutStatus } from '@/types/sellerPayout';

interface Props {
    payouts: SellerPayout[];
}

const statusLabel: Record<SellerPayoutStatus, string> = {
    pending: 'Pending',
    paid: 'Paid — awaiting your confirmation',
    confirmed: 'Confirmed',
};

export default function SellerPayouts({ payouts: initial }: Props) {
    const [payouts, setPayouts] = useState(initial);
    const [previewTarget, setPreviewTarget] = useState<SellerPayout | null>(null);
    const [busy, setBusy] = useState<number | null>(null);

    async function confirm(payout: SellerPayout) {
        setBusy(payout.id);
        try {
            const updated = await api.post<SellerPayout>(`/seller/payouts/${payout.id}/confirm`);
            setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            toast.success('Thanks — payout confirmed.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't confirm the payout."));
        } finally {
            setBusy(null);
        }
    }

    return (
        <SellerLayout breadcrumb={['Payouts']}>
            <div className="mx-auto w-full max-w-3xl space-y-6">
                <h1 className="text-2xl font-semibold">Payouts</h1>

                {payouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payouts yet.</p>
                ) : (
                    <div className="space-y-3">
                        {payouts.map((payout) => (
                            <Card key={payout.id}>
                                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                                    <div>
                                        <p className="font-medium">
                                            Order #{payout.order_id} — ${payout.amount.toFixed(2)}
                                        </p>
                                        {payout.has_slip && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto p-0 text-sm"
                                                onClick={() => setPreviewTarget(payout)}
                                            >
                                                View payment slip
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={payout.status === 'confirmed' ? 'default' : 'secondary'}>
                                            {statusLabel[payout.status]}
                                        </Badge>
                                        {payout.status === 'paid' && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={busy === payout.id}
                                                onClick={() => confirm(payout)}
                                            >
                                                Confirm received
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <SlipPreviewDialog
                    open={previewTarget !== null}
                    onOpenChange={(open) => !open && setPreviewTarget(null)}
                    slipUrl={previewTarget ? `/api/seller/payouts/${previewTarget.id}` : ''}
                    title="Payout slip"
                />
            </div>
        </SellerLayout>
    );
}
