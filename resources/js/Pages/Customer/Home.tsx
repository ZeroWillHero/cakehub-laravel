import { Link } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import CustomerLayout from '@/Layouts/CustomerLayout';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
import type { Category } from '@/types/category';

interface Props {
    categories: Category[];
}

export default function CustomerHome({ categories }: Props) {
    return (
        <CustomerLayout>
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="font-heading text-3xl font-semibold">Find your next cake</h1>
                    <div className="flex items-center gap-4 text-sm">
                        <Link href="/cart" className="text-primary underline">
                            Cart
                        </Link>
                        <Link href="/orders" className="text-primary underline">
                            Orders
                        </Link>
                        <Link href="/account" className="text-primary underline">
                            Account
                        </Link>
                    </div>
                </div>
                <p className="mt-2 text-muted-foreground">Browse by category, or search nearby bakers.</p>

                <Link href="/search" className="mt-6 block">
                    <Input
                        placeholder="Search cakes, bakeries…"
                        readOnly
                        className="min-h-11 cursor-pointer bg-card"
                    />
                </Link>

                <ImagePlaceholder label="Featured cakes" className="mt-6 aspect-[16/6] w-full" />

                <h2 className="font-heading mt-8 text-xl font-semibold">Categories</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
            </div>
        </CustomerLayout>
    );
}
