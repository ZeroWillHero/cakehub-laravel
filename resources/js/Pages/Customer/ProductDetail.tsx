import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import CustomerLayout from '@/Layouts/CustomerLayout';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
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

    const variant = product.variants.find((v) => v.id === selectedVariant);
    const price = product.base_price + (variant?.price_modifier ?? 0);

    return (
        <CustomerLayout>
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <Link href={`/sellers/${seller.slug}`} className="text-sm text-primary underline">
                    ← {seller.business_name}
                </Link>

                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <ImagePlaceholder label={product.name} className="aspect-square w-full" />

                    <div>
                        <h1 className="font-heading text-2xl font-semibold">{product.name}</h1>
                        <p className="mt-1 text-lg">${price.toFixed(2)}</p>
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
                                            className={cn(
                                                'min-h-9 rounded-md border px-3 text-sm',
                                                selectedVariant === v.id ? 'border-primary bg-primary/5' : '',
                                            )}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <a
                            href={whatsappLink(seller, product)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(buttonVariants({ size: 'lg' }), 'mt-6 w-full min-h-11')}
                        >
                            Order via WhatsApp
                        </a>
                        <p className="mt-2 text-xs text-muted-foreground">
                            In-platform checkout arrives in a later phase — order directly with the seller for now.
                        </p>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
