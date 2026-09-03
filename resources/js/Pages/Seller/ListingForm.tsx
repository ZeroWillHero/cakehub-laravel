import { router } from '@inertiajs/react';
import { useRef, useState, type ChangeEventHandler, type SubmitEventHandler } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import SellerLayout from '@/Layouts/SellerLayout';
import ListingUsageIndicator from '@/components/shared/ListingUsageIndicator';
import Spinner from '@/components/shared/Spinner';
import { api } from '@/lib/api';
import type { Category } from '@/types/category';
import type { Product, ProductAvailabilityStatus, ProductImage } from '@/types/product';

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
    const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
    const [imageError, setImageError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const uploadImage: ChangeEventHandler<HTMLInputElement> = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !product) return;

        setUploading(true);
        setImageError(null);

        try {
            const formData = new FormData();
            formData.append('image', file);
            const uploaded = await api.upload<ProductImage>(`/seller/products/${product.id}/images`, formData);
            setImages((prev) => [...prev, uploaded]);
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]> };
            setImageError(apiError.errors?.image?.[0] ?? 'Could not upload image.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    async function removeImage(imageId: number) {
        if (!product) return;
        await api.delete(`/seller/products/${product.id}/images/${imageId}`);
        setImages((prev) => prev.filter((img) => img.id !== imageId));
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
        <SellerLayout breadcrumb={['Listings', isEdit ? 'Edit listing' : 'Add product']}>
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
                                            <SelectValue>
                                                {(value: ProductAvailabilityStatus) =>
                                                    availabilityOptions.find((opt) => opt.value === value)?.label
                                                }
                                            </SelectValue>
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
                                {saving && <Spinner className="mr-2" />}
                                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {isEdit && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Photos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {images.length === 0 && (
                                <p className="text-sm text-muted-foreground">No photos yet.</p>
                            )}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {images.map((image) => (
                                    <div key={image.id} className="group relative aspect-square overflow-hidden rounded-md border">
                                        <img src={image.url} alt="" className="h-full w-full object-cover" />
                                        <AlertDialog>
                                            <AlertDialogTrigger className="absolute right-1 top-1 min-h-8 min-w-8 rounded-md bg-background/90 px-2 text-xs text-destructive shadow">
                                                Remove
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => removeImage(image.id)}>
                                                        Remove
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <Label htmlFor="image-upload" className="mb-2 block">
                                    Add a photo
                                </Label>
                                <input
                                    ref={fileInputRef}
                                    id="image-upload"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={uploadImage}
                                    disabled={uploading}
                                    className="min-h-11 w-full text-sm file:mr-3 file:min-h-11 file:rounded-md file:border file:bg-background file:px-3 file:text-sm"
                                />
                                {uploading && <p className="mt-1 text-sm text-muted-foreground">Uploading…</p>}
                                {imageError && <p className="mt-1 text-sm text-destructive">{imageError}</p>}
                            </div>
                        </CardContent>
                    </Card>
                )}
        </SellerLayout>
    );
}
