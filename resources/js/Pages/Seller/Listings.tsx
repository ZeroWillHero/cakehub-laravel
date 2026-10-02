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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SellerLayout from '@/Layouts/SellerLayout';
import ListingUsageIndicator from '@/components/shared/ListingUsageIndicator';
import SmartImage from '@/components/shared/SmartImage';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

interface Props {
    products: Product[];
    usage: number;
    limit: number | null;
    categories: Category[];
}

const statusLabel: Record<Product['availability_status'], string> = {
    in_stock: 'In stock',
    made_to_order: 'Made to order',
    unavailable: 'Unavailable',
};

export default function Listings({ products: initialProducts, limit, categories }: Props) {
    const [products, setProducts] = useState(initialProducts);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
    // Derived from local state (not the initial `usage` prop) so it stays
    // correct after a delete without a full page reload.
    const usage = products.length;
    const atLimit = limit !== null && usage >= limit;

    const visibleProducts = products.filter((product) => {
        if (categoryFilter !== 'all' && !product.categories.some((c) => String(c.id) === categoryFilter)) {
            return false;
        }
        if (availabilityFilter !== 'all' && product.availability_status !== availabilityFilter) {
            return false;
        }
        return true;
    });

    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function remove(id: number) {
        setDeleteError(null);
        try {
            await api.delete(`/seller/products/${id}`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            setDeleteError(errorMessage(err, undefined, "We couldn't delete that listing. Please try again."));
        }
    }

    return (
        <SellerLayout breadcrumb={['Listings']}>
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

                {products.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
                            <SelectTrigger className="w-44" aria-label="Filter by category">
                                <SelectValue>
                                    {(value: string) =>
                                        value === 'all'
                                            ? 'All categories'
                                            : (categories.find((c) => String(c.id) === value)?.name ?? 'All categories')
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v ?? 'all')}>
                            <SelectTrigger className="w-44" aria-label="Filter by availability">
                                <SelectValue>
                                    {(value: string) =>
                                        value === 'all'
                                            ? 'All availability'
                                            : statusLabel[value as Product['availability_status']]
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All availability</SelectItem>
                                {Object.entries(statusLabel).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {deleteError && (
                    <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                        {deleteError}
                    </p>
                )}

                {visibleProducts.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            {products.length === 0
                                ? 'No listings yet. Add your first product to start selling.'
                                : 'No listings match your filters.'}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {visibleProducts.map((product) => (
                            <Card key={product.id}>
                                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <SmartImage
                                            src={product.images[0]?.url}
                                            alt={product.name}
                                            fallbackLabel="No photo"
                                            className="size-16 shrink-0 rounded-lg border"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">{product.name}</p>
                                                {!product.is_active && <Badge variant="secondary">Unpublished</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                ${product.base_price.toFixed(2)} ·{' '}
                                                {statusLabel[product.availability_status]}
                                            </p>
                                            {product.images.length === 0 ? (
                                                <Link
                                                    href={`/seller/listings/${product.id}/edit`}
                                                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                                                >
                                                    No photos yet — add some so customers can see your cake
                                                </Link>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    {product.images.length} photo{product.images.length === 1 ? '' : 's'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/seller/listings/${product.id}/edit`}
                                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11 sm:min-h-9')}
                                        >
                                            Edit
                                        </Link>
                                        <AlertDialog>
                                            <AlertDialogTrigger
                                                className={cn(
                                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                                    'min-h-11 text-destructive hover:text-destructive sm:min-h-9',
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
                                                    <AlertDialogAction variant="destructive" onClick={() => remove(product.id)}>
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
        </SellerLayout>
    );
}
