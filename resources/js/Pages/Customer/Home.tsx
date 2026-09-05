import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import CustomerLayout from '@/Layouts/CustomerLayout';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
import HeroImage from '@/components/shared/HeroImage';
import PageHero from '@/components/shared/PageHero';
import Section from '@/components/shared/Section';
import RatingStars from '@/components/shared/RatingStars';
import type { Category } from '@/types/category';
import type { Seller } from '@/types/seller';

interface Props {
    categories: Category[];
    featuredSellers: Seller[];
}

interface NearbySeller extends Seller {
    distance_km?: number;
}

export default function CustomerHome({ categories, featuredSellers }: Props) {
    const [nearMe, setNearMe] = useState(false);
    const [nearbySellers, setNearbySellers] = useState<NearbySeller[]>([]);
    const [nearMeStatus, setNearMeStatus] = useState<'idle' | 'loading' | 'error'>('idle');

    function handleNearMeToggle(checked: boolean) {
        setNearMe(checked);

        if (!checked) {
            setNearMeStatus('idle');
            setNearbySellers([]);
            return;
        }

        if (!('geolocation' in navigator)) {
            setNearMeStatus('error');
            return;
        }

        setNearMeStatus('loading');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const params = new URLSearchParams({
                        lat: String(position.coords.latitude),
                        lng: String(position.coords.longitude),
                    });
                    const response = await fetch(`/api/sellers/nearby?${params.toString()}`, {
                        headers: { Accept: 'application/json' },
                        credentials: 'include',
                    });
                    const json = await response.json();
                    setNearbySellers(json.data ?? []);
                    setNearMeStatus('idle');
                } catch {
                    setNearMeStatus('error');
                }
            },
            () => {
                setNearMeStatus('error');
            },
        );
    }

    return (
        <CustomerLayout>
            <PageHero
                size="lg"
                title="Cake, made for the moment."
                subtitle="Browse local bakers by category, or find the ones closest to you — order straight through CakeHub or message them directly."
                actions={
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Link href="/search" className="block flex-1">
                            <Input
                                placeholder="Search cakes, bakeries…"
                                readOnly
                                className="min-h-11 cursor-pointer bg-card"
                            />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Switch id="near-me" checked={nearMe} onCheckedChange={handleNearMeToggle} />
                            <Label htmlFor="near-me" className="text-sm font-medium">
                                Near me
                            </Label>
                        </div>
                    </div>
                }
                media={
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-6 rounded-full bg-secondary/15 blur-2xl" aria-hidden="true" />
                        <div className="absolute inset-x-10 bottom-2 top-16 -z-10 rounded-[3rem] bg-primary/10" aria-hidden="true" />
                        <HeroImage
                            src="/images/hero/hero.png"
                            alt="Stacked slices of chocolate, strawberry, and red velvet cake"
                            label="Hero cake photography"
                            className="relative z-10 aspect-[4/5] w-full max-w-sm drop-shadow-xl"
                        />
                    </div>
                }
            />

            {nearMe && (
                <Section title="Near you" className="pb-0 pt-8 sm:pt-10">
                    {nearMeStatus === 'loading' && (
                        <p className="text-sm text-muted-foreground">Finding bakers near you…</p>
                    )}
                    {nearMeStatus === 'error' && (
                        <p className="text-sm text-muted-foreground">
                            We couldn&apos;t access your location. You can allow location access in your browser
                            and try again.
                        </p>
                    )}
                    {nearMeStatus === 'idle' && nearbySellers.length === 0 && (
                        <p className="text-sm text-muted-foreground">No bakers found nearby yet.</p>
                    )}
                    {nearbySellers.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {nearbySellers.map((seller) => (
                                <Link key={seller.id} href={`/sellers/${seller.slug}`}>
                                    <Card className="transition-shadow hover:shadow-md">
                                        <CardContent className="flex items-center gap-3 py-4">
                                            {seller.cover_path ? (
                                                <img
                                                    src={`/storage/${seller.cover_path}`}
                                                    alt={seller.business_name}
                                                    className="size-14 shrink-0 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <ImagePlaceholder label={seller.business_name} className="size-14 shrink-0" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{seller.business_name}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <RatingStars value={Math.round(seller.average_rating)} size={14} />
                                                    {seller.distance_km !== undefined && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {seller.distance_km} km
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </Section>
            )}

            <Section title="Featured cakes">
                <Carousel opts={{ align: 'start' }}>
                    <CarouselContent>
                        {categories.slice(0, 6).map((category) => (
                            <CarouselItem key={category.id} className="basis-2/3 sm:basis-1/2 lg:basis-1/3">
                                <ImagePlaceholder label={category.name} className="aspect-[16/10] w-full" />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </Section>

            <Section title="Categories">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {categories.map((category) => (
                        <Link key={category.id} href={`/search?category_id=${category.id}`}>
                            <Card className="transition-shadow hover:shadow-md">
                                <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                                    <ImagePlaceholder label={category.name} className="aspect-square w-full" />
                                    <span className="text-sm font-medium">{category.name}</span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </Section>

            {featuredSellers.length > 0 && (
                <Section title="Featured bakers" description="Our highest-rated sellers right now.">
                    <Carousel opts={{ align: 'start' }}>
                        <CarouselContent>
                            {featuredSellers.map((seller) => (
                                <CarouselItem key={seller.id} className="basis-4/5 sm:basis-1/2 lg:basis-1/3">
                                    <Link href={`/sellers/${seller.slug}`}>
                                        <Card className="h-full transition-shadow hover:shadow-md">
                                            <CardContent className="flex flex-col gap-3 py-4">
                                                {seller.cover_path ? (
                                                    <img
                                                        src={`/storage/${seller.cover_path}`}
                                                        alt={seller.business_name}
                                                        className="aspect-[16/9] w-full rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <ImagePlaceholder
                                                        label={seller.business_name}
                                                        className="aspect-[16/9] w-full"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium">{seller.business_name}</p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <RatingStars
                                                            value={Math.round(seller.average_rating)}
                                                            size={14}
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            {seller.average_rating.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </Section>
            )}
        </CustomerLayout>
    );
}
