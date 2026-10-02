import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import CustomerLayout from '@/Layouts/CustomerLayout';
import SmartImage from '@/components/shared/SmartImage';
import PageHero from '@/components/shared/PageHero';
import RatingStars from '@/components/shared/RatingStars';
import Section from '@/components/shared/Section';
import { api } from '@/lib/api';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

interface Props {
    categories: Category[];
}

type GeoState = 'idle' | 'locating' | 'granted' | 'denied';

function queryParam(name: string): string | null {
    return new URLSearchParams(window.location.search).get(name);
}

export default function Products({ categories }: Props) {
    const [query, setQuery] = useState(queryParam('q') ?? '');
    const [categoryId, setCategoryId] = useState<number | null>(
        queryParam('category_id') ? Number(queryParam('category_id')) : null,
    );
    const [inStockOnly, setInStockOnly] = useState(false);
    const [geo, setGeo] = useState<GeoState>('idle');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    function useNearMe() {
        if (!navigator.geolocation) {
            setGeo('denied');
            return;
        }
        setGeo('locating');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeo('granted');
            },
            () => setGeo('denied'),
        );
    }

    function clearLocation() {
        setCoords(null);
        setGeo('idle');
    }

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (categoryId) params.set('category_id', String(categoryId));
        if (inStockOnly) params.set('in_stock', '1');
        if (coords) {
            params.set('lat', String(coords.lat));
            params.set('lng', String(coords.lng));
            params.set('radius_km', '10');
        }

        const handle = window.setTimeout(() => {
            api.get<Product[]>(`/products/search?${params}`)
                .then((data) => {
                    // Ignore this response if a newer request has since
                    // superseded it (fast typing can resolve out of order).
                    if (!cancelled) setProducts(data);
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(handle);
        };
    }, [query, categoryId, inStockOnly, coords]);

    return (
        <CustomerLayout>
            <PageHero
                size="sm"
                title="Shop all cakes"
                subtitle="Search by cake, bakery name, or find what's closest to you."
            />

            <Section className="pt-0">
                <div className="space-y-4">
                    <Input
                        type="search"
                        placeholder="Search cakes or bakeries…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search products"
                        className="min-h-11"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant={categoryId === null ? 'default' : 'outline'}
                            size="sm"
                            className="min-h-11 rounded-full px-4 sm:min-h-8"
                            onClick={() => setCategoryId(null)}
                        >
                            All
                        </Button>
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                type="button"
                                variant={categoryId === category.id ? 'default' : 'outline'}
                                size="sm"
                                className="min-h-11 rounded-full px-4 sm:min-h-8"
                                onClick={() => setCategoryId(category.id)}
                            >
                                {category.name}
                            </Button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="size-4 accent-primary"
                                checked={inStockOnly}
                                onChange={(e) => setInStockOnly(e.target.checked)}
                            />
                            In stock only
                        </label>

                        <Button
                            type="button"
                            variant={coords !== null ? 'default' : 'outline'}
                            size="sm"
                            className="min-h-11 rounded-full px-4 sm:min-h-8"
                            onClick={coords !== null ? clearLocation : useNearMe}
                            disabled={geo === 'locating'}
                        >
                            {geo === 'locating' ? 'Locating…' : coords !== null ? 'Near me ✕' : 'Near me'}
                        </Button>
                        {geo === 'denied' && (
                            <span className="text-sm text-muted-foreground">
                                Couldn&apos;t get your location — showing all results instead.
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    {loading && (
                        <div
                            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                            role="status"
                            aria-label="Loading products"
                        >
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="aspect-square w-full rounded-lg" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && products.length === 0 && (
                        <Card>
                            <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                No cakes found. Try a different search, category, or widen your search area.
                            </CardContent>
                        </Card>
                    )}

                    {!loading && products.length > 0 && (
                        <div
                            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                            aria-label={`${products.length} products found`}
                        >
                            {products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={product.seller ? `/sellers/${product.seller.slug}/products/${product.id}` : '#'}
                                >
                                    <Card className="h-full transition-shadow hover:shadow-md">
                                        <SmartImage src={product.images[0]?.url} alt={product.name} className="aspect-square w-full rounded-t-lg" />
                                        <CardContent className="space-y-1 py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="line-clamp-1 text-sm font-medium">{product.name}</span>
                                                {product.availability_status !== 'in_stock' && (
                                                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                                                        {product.availability_status === 'made_to_order'
                                                            ? 'Made to order'
                                                            : 'Unavailable'}
                                                    </Badge>
                                                )}
                                            </div>
                                            {product.seller && (
                                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                                    {product.seller.business_name}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <span className="text-sm font-semibold">
                                                    ${product.base_price.toFixed(2)}
                                                </span>
                                                {product.average_rating > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <RatingStars value={Math.round(product.average_rating)} size={12} />
                                                    </div>
                                                )}
                                            </div>
                                            {product.distance_km !== undefined && (
                                                <p className="text-xs text-muted-foreground">
                                                    {product.distance_km} km away
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </Section>
        </CustomerLayout>
    );
}
