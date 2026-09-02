import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CustomerLayout from '@/Layouts/CustomerLayout';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';
import type { Seller } from '@/types/seller';

interface Props {
    seller: Seller;
    products: Product[];
}

function whatsappLink(seller: Seller): string {
    const digits = seller.whatsapp_number.replace(/[^\d]/g, '');
    const text = encodeURIComponent(`Hi ${seller.business_name}, I found you on CakeHub!`);
    return `https://wa.me/${digits}?text=${text}`;
}

export default function Storefront({ seller, products }: Props) {
    return (
        <CustomerLayout>
            <ImagePlaceholder label={`${seller.business_name} cover photo`} className="aspect-[3/1] w-full rounded-none" />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-heading text-2xl font-semibold">{seller.business_name}</h1>
                            {seller.verification_status === 'verified' && <Badge>Verified</Badge>}
                        </div>
                        {seller.address_line && (
                            <p className="mt-1 text-sm text-muted-foreground">{seller.address_line}</p>
                        )}
                        {seller.description && <p className="mt-3 max-w-xl">{seller.description}</p>}
                    </div>
                    <a
                        href={whatsappLink(seller)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ size: 'lg' }), 'min-h-11')}
                    >
                        Contact on WhatsApp
                    </a>
                </div>

                <h2 className="font-heading mt-8 text-xl font-semibold">Products</h2>
                {products.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">No products listed yet.</p>
                ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <Link key={product.id} href={`/sellers/${seller.slug}/products/${product.id}`}>
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <ImagePlaceholder
                                        label={product.name}
                                        className="aspect-square w-full rounded-b-none"
                                    />
                                    <CardContent className="py-4">
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            ${product.base_price.toFixed(2)}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
