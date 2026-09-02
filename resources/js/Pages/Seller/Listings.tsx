import { Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ListingUsageIndicator from '@/components/shared/ListingUsageIndicator';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';

interface Props {
    products: Product[];
    usage: number;
    limit: number | null;
}

const statusLabel: Record<Product['availability_status'], string> = {
    in_stock: 'In stock',
    made_to_order: 'Made to order',
    unavailable: 'Unavailable',
};

export default function Listings({ products: initialProducts, limit }: Props) {
    const [products, setProducts] = useState(initialProducts);
    // Derived from local state (not the initial `usage` prop) so it stays
    // correct after a delete without a full page reload.
    const usage = products.length;
    const atLimit = limit !== null && usage >= limit;

    async function remove(id: number) {
        await api.delete(`/seller/products/${id}`);
        setProducts((prev) => prev.filter((p) => p.id !== id));
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-semibold">Listings</h1>
                    {atLimit ? (
                        <span className="text-sm text-muted-foreground">
                            Listing limit reached — upgrade your subscription to add more.
                        </span>
                    ) : (
                        <Link href="/seller/listings/create" className={buttonVariants()}>
                            Add product
                        </Link>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ListingUsageIndicator usage={usage} limit={limit} />
                    </CardContent>
                </Card>

                {products.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No listings yet. Add your first product to start selling.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {products.map((product) => (
                            <Card key={product.id}>
                                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{product.name}</p>
                                            {!product.is_active && <Badge variant="secondary">Unpublished</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            ${product.base_price.toFixed(2)} ·{' '}
                                            {statusLabel[product.availability_status]}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/seller/listings/${product.id}/edit`}
                                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-9')}
                                        >
                                            Edit
                                        </Link>
                                        <AlertDialog>
                                            <AlertDialogTrigger
                                                className={cn(
                                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                                    'min-h-9 text-destructive hover:text-destructive',
                                                )}
                                            >
                                                Delete
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete "{product.name}"?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This removes the listing permanently and cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => remove(product.id)}>
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
