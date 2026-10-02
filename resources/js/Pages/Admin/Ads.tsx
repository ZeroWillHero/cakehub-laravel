import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/Layouts/AdminLayout';
import ImageThumbUpload from '@/components/shared/ImageThumbUpload';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { api } from '@/lib/api';
import type { Ad, AdStatus } from '@/types/ad';

interface Props {
    ads: Ad[];
    setting: { rotation_seconds: number };
}

const emptyForm = { name: '', description: '', link_url: '', paid_amount: '', starts_at: '', ends_at: '' };

const statusLabel: Record<AdStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    paused: 'Paused',
};

function SortableAdRow({
    ad,
    onDelete,
    onStatusChange,
    onUploadImage,
    onImageInvalid,
    imageError,
}: {
    ad: Ad;
    onDelete: () => void;
    onStatusChange: (status: AdStatus) => void;
    onUploadImage: (file: File) => Promise<void>;
    onImageInvalid: (message: string) => void;
    imageError?: string;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ad.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
        >
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    className="inline-flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
                    aria-label={`Drag to reorder ${ad.name}`}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-4" />
                </button>
                <ImageThumbUpload
                    name={ad.name}
                    url={ad.image_url}
                    onUpload={onUploadImage}
                    onInvalid={onImageInvalid}
                />
                <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{ad.name}</span>
                        <Badge variant={ad.is_currently_visible ? 'default' : 'secondary'}>
                            {ad.is_currently_visible ? 'Live' : statusLabel[ad.status]}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        ${ad.paid_amount.toFixed(2)} · {ad.starts_at} → {ad.ends_at}
                    </p>
                    {!ad.image_url && !imageError && (
                        <p className="text-xs text-muted-foreground">Add a banner image — 1200 × 550px landscape works best.</p>
                    )}
                    {imageError && <p className="text-xs text-destructive">{imageError}</p>}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Select value={ad.status} onValueChange={(v) => onStatusChange(v as AdStatus)}>
                    <SelectTrigger className="w-28">
                        <SelectValue>{(value: AdStatus) => statusLabel[value]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
                    Delete
                </Button>
            </div>
        </div>
    );
}

export default function AdminAds({ ads: initial, setting: initialSetting }: Props) {
    const [ads, setAds] = useState([...initial].sort((a, b) => a.sort_order - b.sort_order));
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
    const [busy, setBusy] = useState(false);
    const [imageErrors, setImageErrors] = useState<Record<number, string>>({});
    const [rotationSeconds, setRotationSeconds] = useState(String(initialSetting.rotation_seconds));
    const [settingBusy, setSettingBusy] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    async function createAd() {
        setBusy(true);
        try {
            const created = await api.post<Ad>('/admin/ads', {
                name: form.name,
                description: form.description || null,
                link_url: form.link_url || null,
                paid_amount: Number(form.paid_amount),
                starts_at: form.starts_at,
                ends_at: form.ends_at,
            });
            setAds((prev) => [...prev, created]);
            setCreateOpen(false);
            setForm(emptyForm);
            toast.success('Ad created. Add a banner image next.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't create the ad."));
        } finally {
            setBusy(false);
        }
    }

    async function uploadImage(ad: Ad, file: File) {
        setImageErrors((prev) => ({ ...prev, [ad.id]: '' }));
        const formData = new FormData();
        formData.append('image', file);
        try {
            const updated = await api.upload<Ad>(`/admin/ads/${ad.id}/image`, formData);
            setAds((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        } catch (err) {
            const apiError = err as { message?: string; errors?: Record<string, string[]> };
            setImageErrors((prev) => ({
                ...prev,
                [ad.id]: apiError.errors?.image?.[0] ?? apiError.message ?? 'Could not upload image.',
            }));
        }
    }

    async function updateStatus(ad: Ad, status: AdStatus) {
        try {
            const updated = await api.put<Ad>(`/admin/ads/${ad.id}`, { status });
            setAds((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't change the ad status."));
        }
    }

    async function remove() {
        if (!deleteTarget) return;
        setBusy(true);
        try {
            await api.delete(`/admin/ads/${deleteTarget.id}`);
            setAds((prev) => prev.filter((a) => a.id !== deleteTarget.id));
            setDeleteTarget(null);
            toast.success('Ad deleted.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't delete the ad."));
        } finally {
            setBusy(false);
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = ads.findIndex((a) => a.id === active.id);
        const newIndex = ads.findIndex((a) => a.id === over.id);
        const reordered = arrayMove(ads, oldIndex, newIndex);
        setAds(reordered);

        try {
            await api.patch('/admin/ads/reorder', { order: reordered.map((a) => a.id) });
        } catch (err) {
            setAds(ads);
            toast.error(errorMessage(err, undefined, "Couldn't save the new order. Please try again."));
        }
    }

    async function saveSetting() {
        setSettingBusy(true);
        try {
            await api.put('/admin/ads/setting', { rotation_seconds: Number(rotationSeconds) });
            toast.success('Rotation speed saved.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't save the setting."));
        } finally {
            setSettingBusy(false);
        }
    }

    return (
        <AdminLayout breadcrumb={['Ads']}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Ads</h1>
                <Button type="button" onClick={() => setCreateOpen(true)}>
                    Add ad
                </Button>
            </div>

            <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
                <div className="space-y-2">
                    <Label htmlFor="rotation_seconds">Carousel rotation (seconds per ad)</Label>
                    <Input
                        id="rotation_seconds"
                        type="number"
                        min={1}
                        max={60}
                        className="w-32"
                        value={rotationSeconds}
                        onChange={(e) => setRotationSeconds(e.target.value)}
                    />
                </div>
                <Button type="button" variant="outline" disabled={settingBusy} onClick={saveSetting}>
                    Save
                </Button>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
                <p>Drag ads by the handle to set priority — top shows first in the homepage carousel.</p>
                <p>
                    Preferred image size: <span className="font-medium text-foreground">1200 × 550px</span> (landscape
                    banner, ~2.2:1) — JPG, PNG, or WebP, up to 20MB. The carousel is slightly narrower than the page's
                    full content width and taller than a typical section, and crops to fit — avoid important content
                    near the top/bottom edges.
                </p>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="divide-y rounded-lg border">
                    <SortableContext items={ads.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                        {ads.map((ad) => (
                            <SortableAdRow
                                key={ad.id}
                                ad={ad}
                                imageError={imageErrors[ad.id]}
                                onDelete={() => setDeleteTarget(ad)}
                                onStatusChange={(status) => updateStatus(ad, status)}
                                onUploadImage={(file) => uploadImage(ad, file)}
                                onImageInvalid={(message) => setImageErrors((prev) => ({ ...prev, [ad.id]: message }))}
                            />
                        ))}
                    </SortableContext>
                    {ads.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No ads yet.</p>
                    )}
                </div>
            </DndContext>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add ad</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="ad_name">Name</Label>
                            <Input
                                id="ad_name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ad_description">Description</Label>
                            <Textarea
                                id="ad_description"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ad_link_url">Link URL (optional)</Label>
                            <Input
                                id="ad_link_url"
                                type="url"
                                placeholder="https://…"
                                value={form.link_url}
                                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Clicking this ad on the homepage carousel will open this URL.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ad_paid_amount">Paid amount</Label>
                            <Input
                                id="ad_paid_amount"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.paid_amount}
                                onChange={(e) => setForm((f) => ({ ...f, paid_amount: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="ad_starts_at">Start date</Label>
                                <Input
                                    id="ad_starts_at"
                                    type="date"
                                    value={form.starts_at}
                                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ad_ends_at">End date</Label>
                                <Input
                                    id="ad_ends_at"
                                    type="date"
                                    value={form.ends_at}
                                    onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            disabled={!form.name || !form.paid_amount || !form.starts_at || !form.ends_at || busy}
                            onClick={createAd}
                        >
                            Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the ad from the homepage carousel. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
