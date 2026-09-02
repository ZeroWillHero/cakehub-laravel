import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Seller } from '@/types/seller';

interface Props {
    seller: Seller;
}

const verificationLabel: Record<Seller['verification_status'], string> = {
    pending: 'Pending verification',
    verified: 'Verified',
    rejected: 'Rejected',
    suspended: 'Suspended',
};

export default function SellerDashboard({ seller }: Props) {
    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold">{seller.business_name}</h1>
                    <Badge variant={seller.verification_status === 'verified' ? 'default' : 'secondary'}>
                        {verificationLabel[seller.verification_status]}
                    </Badge>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Getting started</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Listing management, orders, and subscriptions land in later phases (see docs/plan.md).
                        Finish your <a href="/seller/profile" className="text-primary underline">store profile</a> in
                        the meantime.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
