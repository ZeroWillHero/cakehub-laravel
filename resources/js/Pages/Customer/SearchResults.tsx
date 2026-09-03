import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import CustomerLayout from '@/Layouts/CustomerLayout';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
import RatingStars from '@/components/shared/RatingStars';
import SellerMap from '@/components/shared/SellerMap';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/category';
import type { Seller } from '@/types/seller';

interface Props {
    categories: Category[];
}

type ViewMode = 'list' | 'map';
type GeoState = 'idle' | 'locating' | 'granted' | 'denied';

function queryParam(name: string): string | null {
    return new URLSearchParams(window.location.search).get(name);
}

export default function SearchResults({ categories }: Props) {
    const [categoryId, setCategoryId] = useState<number | null>(
        queryParam('category_id') ? Number(queryParam('category_id')) : null,
    );
    const [openNowOnly, setOpenNowOnly] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [ratingMin, setRatingMin] = useState('');
    const [view, setView] = useState<ViewMode>('list');
    const [geo, setGeo] = useState<GeoState>('idle');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [sellers, setSellers] = useState<Seller[]>([]);
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

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (categoryId) params.set('category_id', String(categoryId));
        if (minPrice) params.set('min_price', minPrice);
        if (maxPrice) params.set('max_price', maxPrice);
        if (ratingMin) params.set('rating_min', ratingMin);

        const path =
            coords !== null
                ? `/sellers/nearby?lat=${coords.lat}&lng=${coords.lng}&radius_km=10&${params}`
                : `/sellers/search?${params}`;

        api.get<Seller[]>(path)
            .then(setSellers)
            .finally(() => setLoading(false));
    }, [categoryId, coords, minPrice, maxPrice, ratingMin]);

    const filteredSellers = useMemo(
        () => (openNowOnly ? sellers.filter((s) => s.store_status === 'open') : sellers),
        [sellers, openNowOnly],
    );

    const mapCenter = coords ?? { lat: 0, lng: 0 };

    return (
        <CustomerLayout>
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="font-heading text-2xl font-semibold">Search bakeries</h1>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant={categoryId === null ? 'default' : 'outline'}
                        size="sm"
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
                            onClick={() => setCategoryId(category.id)}
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="min_price" className="text-xs">
                            Min price
                        </Label>
                        <Input
                            id="min_price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-24"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="max_price" className="text-xs">
                            Max price
                        </Label>
                        <Input
                            id="max_price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-24"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="rating_min" className="text-xs">
                            Min rating
                        </Label>
                        <Input
                            id="rating_min"
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={ratingMin}
                            onChange={(e) => setRatingMin(e.target.value)}
                            className="w-24"
                        />
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant={coords !== null ? 'default' : 'outline'}
                            size="sm"
                            onClick={useNearMe}
                            disabled={geo === 'locating'}
                        >
                            {geo === 'locating' ? 'Locating…' : 'Near me'}
                        </Button>
                        <label className="flex min-h-9 items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={openNowOnly}
                                onChange={(e) => setOpenNowOnly(e.target.checked)}
                            />
                            Open now
                        </label>
                        {geo === 'denied' && (
                            <span className="text-sm text-muted-foreground">
                                Couldn't get your location — showing all results instead.
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1 rounded-md border p-1">
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className={cn(
                                'min-h-9 rounded-sm px-3 text-sm',
                                view === 'list' ? 'bg-primary text-primary-foreground' : '',
                            )}
                        >
                            List
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('map')}
                            disabled={coords === null}
                            className={cn(
                                'min-h-9 rounded-sm px-3 text-sm disabled:opacity-40',
                                view === 'map' ? 'bg-primary text-primary-foreground' : '',
                            )}
                        >
                            Map
                        </button>
                    </div>
                </div>

                <div className="mt-6">
                    {loading && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Loading results">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="aspect-video w-full rounded-lg" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && filteredSellers.length === 0 && (
                        <Card>
                            <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                No sellers found. Try a different category or widen your search.
                            </CardContent>
                        </Card>
                    )}

                    {!loading && filteredSellers.length > 0 && view === 'map' && coords !== null && (
                        <div className="h-96 overflow-hidden rounded-lg border">
                            <SellerMap center={mapCenter} sellers={filteredSellers} />
                        </div>
                    )}

                    {!loading && filteredSellers.length > 0 && view === 'list' && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {filteredSellers.map((seller) => (
                                <Link key={seller.id} href={`/sellers/${seller.slug}`}>
                                    <Card className="h-full transition-shadow hover:shadow-md">
                                        {seller.cover_path ? (
                                            <img
                                                src={`/storage/${seller.cover_path}`}
                                                alt={seller.business_name}
                                                className="aspect-video w-full rounded-t-lg object-cover"
                                            />
                                        ) : (
                                            <ImagePlaceholder
                                                label={seller.business_name}
                                                className="aspect-video w-full rounded-b-none"
                                            />
                                        )}
                                        <CardContent className="space-y-1 py-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium">{seller.business_name}</span>
                                                {seller.verification_status === 'verified' && (
                                                    <Badge>Verified</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <RatingStars value={Math.round(seller.average_rating)} size={14} />
                                                {seller.average_rating > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {seller.average_rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {seller.distance_km !== undefined
                                                    ? `${seller.distance_km} km away`
                                                    : seller.address_line}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
