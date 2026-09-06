import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    const [busy, setBusy] = useState<number | null>(null);

    async function confirm(payout: SellerPayout) {
        setBusy(payout.id);
        try {
            const updated = await api.post<SellerPayout>(`/seller/payouts/${payout.id}/confirm`);
            setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        } finally {
            setBusy(null);
        }
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
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
                                            <a
                                                href={`/api/seller/payouts/${payout.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-primary underline"
                                            >
                                                View payment slip
                                            </a>
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
            </div>
        </div>
    );
}
