import { Link, router } from '@inertiajs/react';
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
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import CustomerLayout from '@/Layouts/CustomerLayout';
import ProductGallery from '@/components/shared/ProductGallery';
import Spinner from '@/components/shared/Spinner';
import RatingStars from '@/components/shared/RatingStars';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';
import type { Seller } from '@/types/seller';

interface Props {
    seller: Seller;
    product: Product;
}

const availabilityLabel: Record<Product['availability_status'], string> = {
    in_stock: 'In stock',
    made_to_order: 'Made to order',
    unavailable: 'Currently unavailable',
};

function whatsappLink(seller: Seller, product: Product): string {
    const digits = seller.whatsapp_number.replace(/[^\d]/g, '');
    const text = encodeURIComponent(`Hi ${seller.business_name}, I'm interested in "${product.name}" from CakeHub.`);
    return `https://wa.me/${digits}?text=${text}`;
}

export default function ProductDetail({ seller, product }: Props) {
    const [selectedVariant, setSelectedVariant] = useState(
        product.variants.find((v) => v.is_default)?.id ?? product.variants[0]?.id ?? null,
    );
    const [notes, setNotes] = useState('');
    const [adding, setAdding] = useState(false);
    const [confirmSwitch, setConfirmSwitch] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const variant = product.variants.find((v) => v.id === selectedVariant);
    const price = product.base_price + (variant?.price_modifier ?? 0);
    const unavailable = product.availability_status === 'unavailable';

    async function addToCart(replaceCart = false) {
        setAdding(true);
        setError(null);
        try {
            await api.post('/cart', {
                product_id: product.id,
                product_variant_id: selectedVariant,
                customization_notes: notes || null,
                replace_cart: replaceCart,
            });
            router.visit('/cart');
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]> };
            if (apiError.errors?.seller_conflict) {
                setConfirmSwitch(true);
            } else {
                setError(apiError.errors?.product_id?.[0] ?? 'Could not add to cart.');
            }
        } finally {
            setAdding(false);
        }
    }

    return (
        <CustomerLayout>
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <Link
                    href={`/sellers/${seller.slug}`}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    ← Back to {seller.business_name}
                </Link>

                <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
                    <ProductGallery images={product.images} name={product.name} />

                    <div>
                        <h1 className="font-heading text-2xl font-semibold">{product.name}</h1>
                        {product.average_rating > 0 && (
                            <div className="mt-1 flex items-center gap-1.5">
                                <RatingStars value={Math.round(product.average_rating)} size={14} />
                                <span className="text-xs text-muted-foreground">
                                    {product.average_rating.toFixed(1)} ({product.reviews?.length ?? 0} review
                                    {product.reviews?.length === 1 ? '' : 's'})
                                </span>
                            </div>
                        )}
                        <p className="mt-2 text-2xl font-semibold">${price.toFixed(2)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {availabilityLabel[product.availability_status]}
                        </p>
                        {product.description && <p className="mt-4">{product.description}</p>}

                        {product.variants.length > 0 && (
                            <div className="mt-6">
                                <p className="mb-2 text-sm font-medium">Options</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setSelectedVariant(v.id)}
                                            aria-pressed={selectedVariant === v.id}
                                            className={cn(
                                                'min-h-11 rounded-lg border px-4 text-sm transition-colors',
                                                selectedVariant === v.id
                                                    ? 'border-primary bg-primary/10 font-medium ring-1 ring-primary'
                                                    : 'hover:bg-muted',
                                            )}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <label htmlFor="notes" className="mb-2 block text-sm font-medium">
                                Customization notes (optional)
                            </label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Happy Birthday Sarah!"
                            />
                        </div>

                        {error && (
                            <p className="mt-3 text-sm text-destructive" role="alert">
                                {error}
                            </p>
                        )}

                        <Button
                            type="button"
                            size="lg"
                            className="mt-4 w-full min-h-11"
                            disabled={adding || unavailable}
                            onClick={() => addToCart(false)}
                        >
                            {adding && <Spinner className="mr-2" />}
                            {unavailable ? 'Unavailable' : adding ? 'Adding…' : 'Add to cart'}
                        </Button>

                        <a
                            href={whatsappLink(seller, product)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'mt-3 w-full min-h-11')}
                        >
                            Order via WhatsApp
                        </a>
                    </div>
                </div>

                {product.reviews && product.reviews.length > 0 && (
                    <div className="mt-8">
                        <h2 className="font-heading text-lg font-semibold">Reviews</h2>
                        <div className="mt-3 space-y-3">
                            {product.reviews.map((review) => (
                                <Card key={review.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="size-6">
                                                <AvatarImage src={review.customer?.avatar_url ?? undefined} alt="" />
                                                <AvatarFallback>
                                                    {review.customer?.name.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <CardTitle className="text-sm font-medium">
                                                {review.customer?.name}
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2 pt-0 text-sm">
                                        <RatingStars value={review.rating} size={14} />
                                        {review.comment && <p>{review.comment}</p>}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AlertDialog open={confirmSwitch} onOpenChange={setConfirmSwitch}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start a new cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your cart has items from a different seller. Adding this will replace your current cart
                            (CakeHub only supports ordering from one seller at a time).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => addToCart(true)}>Replace cart</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CustomerLayout>
    );
}
