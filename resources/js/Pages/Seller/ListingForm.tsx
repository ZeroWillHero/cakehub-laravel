import { router } from '@inertiajs/react';
import { useState, type SubmitEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ListingUsageIndicator from '@/components/shared/ListingUsageIndicator';
import { api } from '@/lib/api';
import type { Category } from '@/types/category';
import type { Product, ProductAvailabilityStatus } from '@/types/product';

interface Props {
    categories: Category[];
    usage: number;
    limit: number | null;
    product: Product | null;
}

interface VariantDraft {
    name: string;
    price_modifier: string;
    is_default: boolean;
}

const availabilityOptions: { value: ProductAvailabilityStatus; label: string }[] = [
    { value: 'in_stock', label: 'In stock' },
    { value: 'made_to_order', label: 'Made to order' },
    { value: 'unavailable', label: 'Unavailable' },
];

export default function ListingForm({ categories, usage, limit, product }: Props) {
    const isEdit = product !== null;
    const atLimit = !isEdit && limit !== null && usage >= limit;

    const [name, setName] = useState(product?.name ?? '');
    const [description, setDescription] = useState(product?.description ?? '');
    const [basePrice, setBasePrice] = useState(product?.base_price.toString() ?? '');
    const [availabilityStatus, setAvailabilityStatus] = useState<ProductAvailabilityStatus>(
        product?.availability_status ?? 'in_stock',
    );
    const [categoryIds, setCategoryIds] = useState<number[]>(product?.categories.map((c) => c.id) ?? []);
    const [variants, setVariants] = useState<VariantDraft[]>(
        product?.variants.map((v) => ({
            name: v.name,
            price_modifier: v.price_modifier.toString(),
            is_default: v.is_default,
        })) ?? [],
    );
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);

    function toggleCategory(id: number) {
        setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    }

    function addVariant() {
        setVariants((prev) => [...prev, { name: '', price_modifier: '0', is_default: prev.length === 0 }]);
    }

    function updateVariant(index: number, patch: Partial<VariantDraft>) {
        setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
    }

    function removeVariant(index: number) {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    }

    const submit: SubmitEventHandler = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        const payload = {
            name,
            description: description || null,
            base_price: Number(basePrice),
            availability_status: availabilityStatus,
            category_ids: categoryIds,
            variants: variants.map((v) => ({
                name: v.name,
                price_modifier: Number(v.price_modifier || 0),
                is_default: v.is_default,
            })),
        };

        try {
            if (isEdit) {
                await api.put(`/seller/products/${product.id}`, payload);
            } else {
                await api.post('/seller/products', payload);
            }
            router.visit('/seller/listings');
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]> };
            setErrors(apiError.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEdit ? 'Edit listing' : 'Add product'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!isEdit && (
                            <div className="mb-6">
                                <ListingUsageIndicator usage={usage} limit={limit} />
                            </div>
                        )}

                        {errors.listing_limit && (
                            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {errors.listing_limit[0]}
                            </p>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    aria-invalid={Boolean(errors.name)}
                                    disabled={atLimit}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={atLimit}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="base_price">Base price</Label>
                                    <Input
                                        id="base_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(e.target.value)}
                                        aria-invalid={Boolean(errors.base_price)}
                                        disabled={atLimit}
                                    />
                                    {errors.base_price && (
                                        <p className="text-sm text-destructive">{errors.base_price[0]}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="availability_status">Availability</Label>
                                    <Select
                                        value={availabilityStatus}
                                        onValueChange={(v) => setAvailabilityStatus(v as ProductAvailabilityStatus)}
                                        disabled={atLimit}
                                    >
                                        <SelectTrigger id="availability_status" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availabilityOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Categories</Label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {categories.map((category) => (
                                        <label
                                            key={category.id}
                                            className="flex min-h-11 items-center gap-2 rounded-md border p-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={categoryIds.includes(category.id)}
                                                onCheckedChange={() => toggleCategory(category.id)}
                                                disabled={atLimit}
                                            />
                                            {category.name}
                                        </label>
                                    ))}
                                </div>
                                {errors.category_ids && (
                                    <p className="text-sm text-destructive">{errors.category_ids[0]}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Size / flavor variants</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addVariant}
                                        disabled={atLimit}
                                    >
                                        Add variant
                                    </Button>
                                </div>
                                {variants.map((variant, index) => (
                                    <div key={index} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                                        <Input
                                            placeholder="e.g. 1kg — Chocolate"
                                            value={variant.name}
                                            onChange={(e) => updateVariant(index, { name: e.target.value })}
                                            className="flex-1 min-w-[10rem]"
                                        />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Price add-on"
                                            value={variant.price_modifier}
                                            onChange={(e) => updateVariant(index, { price_modifier: e.target.value })}
                                            className="w-32"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => removeVariant(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button type="submit" disabled={saving || atLimit} className="min-h-11">
                                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
