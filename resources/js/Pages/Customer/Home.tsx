import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import CustomerLayout from '@/Layouts/CustomerLayout';
import HeroAdsCarousel from '@/components/shared/HeroAdsCarousel';
import SmartImage from '@/components/shared/SmartImage';
import HeroImage from '@/components/shared/HeroImage';
import PageHero from '@/components/shared/PageHero';
import Section from '@/components/shared/Section';
import RatingStars from '@/components/shared/RatingStars';
import { cn } from '@/lib/utils';
import type { Ad } from '@/types/ad';
import type { Category } from '@/types/category';
import type { Seller } from '@/types/seller';
import type { SharedPageProps } from '@/types/shared';
import type { SubscriptionPlan } from '@/types/subscriptionPlan';

interface Props {
    categories: Category[];
    featuredSellers: Seller[];
    subscriptionPlans: SubscriptionPlan[];
    ads: Ad[];
    adRotationSeconds: number;
}

function billingLabel(plan: SubscriptionPlan): string {
    if (plan.price === 0) return 'Free';
    return plan.billing_cycle === 'annual' ? `$${plan.price}/yr` : `$${plan.price}/mo`;
}

// Uneven, top-aligned filmstrip heights for the closing gallery — mirrors
// the varied-height reference layout rather than a uniform grid.
const GALLERY_HEIGHTS = ['h-64', 'h-80', 'h-72', 'h-64', 'h-80', 'h-72', 'h-64'];

const GALLERY_IMAGES = [
    '/images/pexels-diego-romero-471613950-37754294.jpg',
    '/images/pexels-hilal-diken-2153971208-33759172.jpg',
    '/images/pexels-rebornfilmes-31266998.jpg',
    '/images/pexels-morgana-pozzi-2153094746-32552698.jpg',
];

interface NearbySeller extends Seller {
    distance_km?: number;
}

export default function CustomerHome({ categories, featuredSellers, subscriptionPlans, ads, adRotationSeconds }: Props) {
    const galleryImages = [
        ...GALLERY_IMAGES,
        ...featuredSellers.filter((seller) => seller.cover_url).map((seller) => seller.cover_url as string),
    ];

    // Only guests are pitched on selling — signed-in customers never see the
    // "Become a seller" CTAs or the subscription plans (the server also
    // sends them no plans).
    const isGuest = (usePage<SharedPageProps>().props.auth?.user ?? null) === null;

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
                    if (!response.ok) throw new Error(String(response.status));
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

    // Shared by both heroes. Over an ad's dark scrim the Near me label
    // switches to white so it stays readable.
    function heroActions(onDarkBackground: boolean) {
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/products" className={cn(buttonVariants({ size: 'lg' }), 'min-h-11')}>
                        Shop now
                    </Link>
                    {isGuest && (
                        <a href="/onboarding" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'min-h-11')}>
                            Become a seller
                        </a>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Switch id="near-me" checked={nearMe} onCheckedChange={handleNearMeToggle} />
                    <Label htmlFor="near-me" className={cn('text-sm font-medium', onDarkBackground && 'text-white')}>
                        Near me
                    </Label>
                </div>
            </div>
        );
    }

    return (
        <CustomerLayout>
            {/*
              * Live ads take over the hero itself (each ad's image/name/description
              * as a rotating hero slide); with none, the default hero shows.
              */}
            {ads.length > 0 ? (
                <>
                    <h1 className="sr-only">Cake, made for the moment.</h1>
                    <HeroAdsCarousel ads={ads} rotationSeconds={adRotationSeconds} actions={heroActions(true)} />
                </>
            ) : (
                <PageHero
                    size="lg"
                    title="Cake, made for the moment."
                    subtitle="Browse local bakers by category, or find the ones closest to you order straight through CakeHub or message them directly."
                    actions={heroActions(false)}
                />
            )}

            <Section title="Categories">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/search?category_id=${category.id}`}
                            className="group relative block overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {/*
                              * The name is the link text; the photo behind it is decorative.
                              * With no photo (or a broken one), a brand gradient shows instead
                              * of SmartImage's "no photo" icon, which would sit behind the name.
                              */}
                            <SmartImage
                                src={category.image_url}
                                alt=""
                                fallbackLabel=""
                                className="aspect-square w-full bg-linear-to-br from-primary/70 to-accent [&_svg]:hidden"
                                imgClassName="transition-transform duration-300 ease-out group-hover:scale-105"
                            />
                            {/* Dark scrim so the white name stays readable over any photo. */}
                            <div
                                className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50"
                                aria-hidden="true"
                            />
                            <span className="absolute inset-0 flex items-center justify-center p-3 text-center font-heading text-xl font-bold text-balance text-white drop-shadow-md sm:text-2xl lg:text-3xl">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </Section>

            <Section className="pt-0">
                <div className="group/marquee overflow-hidden">
                    <div className="animate-marquee flex w-max items-end gap-4 group-hover/marquee:[animation-play-state:paused]">
                        {[...GALLERY_HEIGHTS, ...GALLERY_HEIGHTS].map((height, index) => (
                            <div key={index} className="shrink-0">
                                <HeroImage
                                    src={galleryImages[index % galleryImages.length]}
                                    alt="Cake photography from CakeHub bakers"
                                    label="Cake photo"
                                    className={cn(
                                        'w-auto rounded-3xl object-cover transition-transform duration-300 ease-out hover:-translate-y-3',
                                        height,
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {nearMe && (
                <Section title="Near you" className="pb-0 pt-8 sm:pt-10">
                    {nearMeStatus === 'loading' && (
                        <div role="status" aria-label="Finding bakers near you">
                            <p className="mb-3 text-sm text-muted-foreground">Finding bakers near you…</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="flex items-center gap-3 rounded-xl border p-4">
                                        <Skeleton className="size-14 shrink-0 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-2/3" />
                                            <Skeleton className="h-3 w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                                            <SmartImage src={seller.cover_url} alt={seller.business_name} className="size-14 shrink-0 rounded-lg" />
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
                                <SmartImage src={category.image_url} alt={category.name} fallbackLabel="" className="aspect-[16/10] w-full rounded-2xl" />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
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
                                                <SmartImage src={seller.cover_url} alt={seller.business_name} className="aspect-[16/9] w-full rounded-lg" />
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

            {isGuest && subscriptionPlans.length > 0 && (
                <Section
                    title="Sell your cakes on CakeHub"
                    description="Reach local customers and manage your own storefront — pick a plan that fits your business."
                    className="bg-accent/20"
                >
                    <Carousel opts={{ align: 'start' }}>
                        <CarouselContent>
                            {subscriptionPlans.map((plan) => (
                                <CarouselItem key={plan.id} className="basis-4/5 sm:basis-1/2 lg:basis-1/3">
                                    <Card className="flex h-full flex-col justify-between">
                                        <CardContent className="space-y-3 py-4">
                                            <p className="font-heading text-lg font-semibold">{plan.name}</p>
                                            <p className="text-2xl font-semibold">{billingLabel(plan)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {plan.listing_limit === null
                                                    ? 'Unlimited listings'
                                                    : `Up to ${plan.listing_limit} listings`}
                                            </p>
                                        </CardContent>
                                        <CardContent className="pt-0">
                                            <a
                                                href="/onboarding"
                                                className="block w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
                                            >
                                                Become a seller
                                            </a>
                                        </CardContent>
                                    </Card>
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
