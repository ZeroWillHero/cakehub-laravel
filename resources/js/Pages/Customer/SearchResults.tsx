import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CustomerLayout from '@/Layouts/CustomerLayout';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
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

        const path =
            coords !== null
                ? `/sellers/nearby?lat=${coords.lat}&lng=${coords.lng}&radius_km=10&${params}`
                : `/sellers/search?${params}`;

        api.get<Seller[]>(path)
            .then(setSellers)
            .finally(() => setLoading(false));
    }, [categoryId, coords]);

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
                    {loading && <p className="text-sm text-muted-foreground">Searching…</p>}

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
                                        <ImagePlaceholder label={seller.business_name} className="aspect-video w-full rounded-b-none" />
                                        <CardContent className="space-y-1 py-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium">{seller.business_name}</span>
                                                {seller.verification_status === 'verified' && (
                                                    <Badge>Verified</Badge>
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
