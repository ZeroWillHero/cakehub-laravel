import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';
import type { Seller } from '@/types/seller';

interface Props {
    sellers: Seller[];
}

export default function VerificationQueue({ sellers }: Props) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const visibleSellers = sellers.filter((seller) => {
        if (!seller.created_at) return true;
        const submitted = seller.created_at.slice(0, 10);
        if (from && submitted < from) return false;
        if (to && submitted > to) return false;
        return true;
    });

    return (
        <AdminLayout breadcrumb={['Verification Queue']}>
            <h1 className="text-2xl font-semibold">Seller verification queue</h1>

            {sellers.length > 0 && (
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="submitted_from" className="text-xs">
                            Submitted from
                        </Label>
                        <Input
                            id="submitted_from"
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="submitted_to" className="text-xs">
                            Submitted to
                        </Label>
                        <Input
                            id="submitted_to"
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-40"
                        />
                    </div>
                </div>
            )}

            {visibleSellers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    {sellers.length === 0
                        ? 'No sellers pending verification.'
                        : 'No sellers match your date filter.'}
                </p>
            ) : (
                <div className="space-y-3">
                    {visibleSellers.map((seller) => (
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
