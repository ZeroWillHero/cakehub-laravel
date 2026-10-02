import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState, type SubmitEventHandler } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import SellerLayout from '@/Layouts/SellerLayout';
import ListingUsageIndicator from '@/components/shared/ListingUsageIndicator';
import ProductPhotoManager, { type PendingPhoto } from '@/components/shared/ProductPhotoManager';
import Spinner from '@/components/shared/Spinner';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
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
    const [categoryList, setCategoryList] = useState<Category[]>(categories);
    const [categoryIds, setCategoryIds] = useState<number[]>(product?.categories.map((c) => c.id) ?? []);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
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
    const [pending, setPending] = useState<PendingPhoto[]>([]);
    const [savePhase, setSavePhase] = useState<string | null>(null);
    const [photosFailed] = useState(() => new URLSearchParams(window.location.search).has('photos_failed'));
    const uploadingRef = useRef(false);
    const uploadingNow = pending.some((p) => p.progress !== null);

    function patchPending(key: string, patch: Partial<PendingPhoto>) {
        setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
    }

    async function uploadPhoto(productId: number, photo: PendingPhoto): Promise<boolean> {
        patchPending(photo.key, { progress: 0, error: null });
        try {
            const formData = new FormData();
            formData.append('image', photo.file);
            const uploaded = await api.upload<ProductImage>(`/seller/products/${productId}/images`, formData, {
                onProgress: (progress) => patchPending(photo.key, { progress }),
            });
            setImages((prev) => [...prev, uploaded]);
            setPending((prev) => prev.filter((p) => p.key !== photo.key));
            URL.revokeObjectURL(photo.previewUrl);
            return true;
        } catch (err) {
            patchPending(photo.key, {
                progress: null,
                error: errorMessage(err, 'image', "We couldn't upload this photo. Please try again."),
            });
            return false;
        }
    }

    // Editing an existing product: upload new photos straight away, one at a
    // time so a slow connection isn't split across several large files.
    useEffect(() => {
        if (!isEdit || uploadingRef.current) return;
        const next = pending.find((p) => p.progress === null && p.error === null);
        if (!next) return;
        uploadingRef.current = true;
        uploadPhoto(product.id, next).finally(() => {
            uploadingRef.current = false;
            setPending((prev) => [...prev]);
        });
    }, [pending, isEdit]);

    function addPhotos(files: File[]) {
        setPending((prev) => [
            ...prev,
            ...files.map((file) => ({
                key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
                file,
                previewUrl: URL.createObjectURL(file),
                progress: null,
                error: null,
            })),
        ]);
    }

    function removePending(key: string) {
        setPending((prev) => {
            const target = prev.find((p) => p.key === key);
            if (target) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((p) => p.key !== key);
        });
    }

    function retryPending(key: string) {
        if (isEdit) {
            patchPending(key, { error: null });
        } else {
            patchPending(key, { error: null, progress: null });
        }
    }

    async function removeImage(image: ProductImage) {
        if (!product) return;
        await api.delete(`/seller/products/${product.id}/images/${image.id}`);
        setImages((prev) => prev.filter((img) => img.id !== image.id));
    }

    function toggleCategory(id: number) {
        setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    }

    async function addCategory() {
        if (!newCategoryName.trim()) return;
        setAddingCategory(true);
        setNewCategoryError(null);
        try {
            const created = await api.post<Category>('/seller/categories', { name: newCategoryName.trim() });
            setCategoryList((prev) => [...prev, created]);
            setCategoryIds((prev) => [...prev, created.id]);
            setNewCategoryName('');
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]> };
            setNewCategoryError(apiError.errors?.name?.[0] ?? 'Could not add category.');
        } finally {
            setAddingCategory(false);
        }
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
                setSavePhase('Saving changes…');
                await api.put(`/seller/products/${product.id}`, payload);
                router.visit('/seller/listings');
                return;
            }

            setSavePhase('Saving product…');
            const created = await api.post<Product>('/seller/products', payload);
            let failed = 0;
            for (const [i, photo] of pending.entries()) {
                setSavePhase(`Uploading photo ${i + 1} of ${pending.length}…`);
                if (!(await uploadPhoto(created.id, photo))) failed++;
            }
            // The product exists now; send them to its edit page if any photo
            // needs another try, otherwise back to the list.
            router.visit(failed > 0 ? `/seller/listings/${created.id}/edit?photos_failed=${failed}` : '/seller/listings');
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]>; message?: string };
            setErrors(apiError.errors ?? { form: [apiError.message ?? 'Could not save. Please try again.'] });
        } finally {
            setSaving(false);
            setSavePhase(null);
        }
    };

    const errorCount = Object.keys(errors).filter((key) => key !== 'listing_limit').length;

    return (
        <SellerLayout breadcrumb={['Listings', isEdit ? 'Edit listing' : 'Add product']}>
            <div className="mx-auto w-full max-w-3xl space-y-6 pb-4">
                <div>
                    <h1 className="text-2xl font-semibold">{isEdit ? 'Edit listing' : 'Add a new product'}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isEdit
                            ? 'Update the photos and details customers see for this product.'
                            : 'Add photos and details — customers will see this on your storefront.'}
                    </p>
                </div>

                {!isEdit && <ListingUsageIndicator usage={usage} limit={limit} />}

                {errors.listing_limit && (
                    <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                        {errors.listing_limit[0]}
                    </p>
                )}

                {photosFailed && pending.length === 0 && (
                    <p className="flex items-start gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm" role="alert">
                        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        Your product was saved, but some photos didn&apos;t upload. Please add them again below.
                    </p>
                )}

                {errorCount > 0 && (
                    <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {errors.form?.[0] ?? 'Some details need fixing — please check the highlighted fields below.'}
                    </p>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Photos</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {isEdit
                                ? 'New photos are saved as soon as you add them.'
                                : 'Pick your photos now — they upload when you click “Add product”.'}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <ProductPhotoManager
                            images={images}
                            pending={pending}
                            deferred={!isEdit}
                            disabled={atLimit || saving}
                            onAdd={addPhotos}
                            onRemoveSaved={removeImage}
                            onRemovePending={removePending}
                            onRetry={retryPending}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Product details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form id="listing-form" onSubmit={submit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Chocolate fudge birthday cake"
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
                                    placeholder="Flavors, size, serving count, how far in advance to order…"
                                    rows={4}
                                    disabled={atLimit}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="base_price">Price ($)</Label>
                                    <Input
                                        id="base_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(e.target.value)}
                                        inputMode="decimal"
                                        placeholder="0.00"
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
                                    {categoryList.map((category) => (
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
                                <div className="flex items-center gap-2 pt-1">
                                    <Input
                                        placeholder="Can't find your category? Add one"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        disabled={atLimit || addingCategory}
                                        className="max-w-xs"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addCategory}
                                        disabled={atLimit || addingCategory || !newCategoryName.trim()}
                                    >
                                        {addingCategory && <Spinner className="mr-2" />}
                                        Add category
                                    </Button>
                                </div>
                                {newCategoryError && <p className="text-sm text-destructive">{newCategoryError}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Size / flavor options</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Optional. Add an extra price for bigger sizes or special flavors (0 if same price).
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addVariant}
                                        disabled={atLimit}
                                    >
                                        Add option
                                    </Button>
                                </div>
                                {variants.map((variant, index) => (
                                    <div key={index} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                                        <Input
                                            placeholder="e.g. 1kg — Chocolate"
                                            aria-label={`Option ${index + 1} name`}
                                            value={variant.name}
                                            onChange={(e) => updateVariant(index, { name: e.target.value })}
                                            className="min-h-11 min-w-40 flex-1"
                                        />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Extra price"
                                            aria-label={`Option ${index + 1} extra price`}
                                            value={variant.price_modifier}
                                            onChange={(e) => updateVariant(index, { price_modifier: e.target.value })}
                                            className="min-h-11 w-32"
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

                        </form>
                    </CardContent>
                </Card>

                <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80">
                    {uploadingNow && !saving && (
                        <span className="mr-auto flex items-center gap-2 text-sm text-muted-foreground" role="status">
                            <Spinner size={14} />
                            Uploading photos — please wait…
                        </span>
                    )}
                    {savePhase && (
                        <span className="mr-auto flex items-center gap-2 text-sm text-muted-foreground" role="status">
                            <Spinner size={14} />
                            {savePhase}
                        </span>
                    )}
                    <Link
                        href="/seller/listings"
                        className="inline-flex min-h-11 items-center rounded-md px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Link>
                    <Button type="submit" form="listing-form" disabled={saving || atLimit || uploadingNow} className="min-h-11 min-w-36">
                        {saving && <Spinner className="mr-2" />}
                        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
                    </Button>
                </div>
            </div>
        </SellerLayout>
    );
}
