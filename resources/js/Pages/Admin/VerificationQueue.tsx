import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/Layouts/AdminLayout';
import type { Seller } from '@/types/seller';

interface Props {
    sellers: Seller[];
}

export default function VerificationQueue({ sellers }: Props) {
    return (
        <AdminLayout breadcrumb={['Verification Queue']}>
            <h1 className="text-2xl font-semibold">Seller verification queue</h1>

            {sellers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sellers pending verification.</p>
            ) : (
                <div className="space-y-3">
                    {sellers.map((seller) => (
                        <Link key={seller.id} href={`/admin/sellers/${seller.id}`}>
                            <Card className="transition-shadow hover:shadow-md">
                                <CardContent className="flex items-center justify-between py-4">
                                    <div>
                                        <p className="font-medium">{seller.business_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {seller.documents?.length ?? 0} document
                                            {seller.documents?.length === 1 ? '' : 's'} submitted
                                        </p>
                                    </div>
                                    <Badge variant="secondary">Pending</Badge>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
