import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import type { Category } from '@/types/category';

interface Props {
    categories: Category[];
}

export default function AdminCategories({ categories: initial }: Props) {
    const [categories, setCategories] = useState(
        [...initial].sort((a, b) => a.sort_order - b.sort_order),
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState('');

    const visibleCategories = categories.filter((c) =>
        c.name.toLowerCase().includes(search.trim().toLowerCase()),
    );

    async function createCategory() {
        setBusy(true);
        try {
            const created = await api.post<Category>('/admin/categories', { name: newName });
            setCategories((prev) => [...prev, created]);
            setCreateOpen(false);
            setNewName('');
        } finally {
            setBusy(false);
        }
    }

    async function toggleActive(category: Category) {
        const updated = await api.put<Category>(`/admin/categories/${category.id}`, {
            is_active: !category.is_active,
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }

    async function remove() {
        if (!deleteTarget) return;
        setBusy(true);
        try {
            await api.delete(`/admin/categories/${deleteTarget.id}`);
            setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            setDeleteTarget(null);
        } finally {
            setBusy(false);
        }
    }

    async function move(categoryId: number, direction: -1 | 1) {
        const index = categories.findIndex((c) => c.id === categoryId);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= categories.length) return;

        const reordered = [...categories];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        setCategories(reordered);

        await api.patch('/admin/categories/reorder', { order: reordered.map((c) => c.id) });
    }

    return (
        <AdminLayout breadcrumb={['Categories']}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Categories</h1>
                <Button type="button" onClick={() => setCreateOpen(true)}>
                    Add category
                </Button>
            </div>

            <div className="max-w-sm">
                <Input
                    placeholder="Search categories…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search categories"
                />
            </div>

            <div className="divide-y rounded-lg border">
                    {visibleCategories.map((category) => {
                        const index = categories.findIndex((c) => c.id === category.id);
                        return (
                        <div key={category.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => move(category.id, -1)}
                                        className="disabled:opacity-30"
                                        aria-label="Move up"
                                    >
                                        <ChevronUp className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === categories.length - 1}
                                        onClick={() => move(category.id, 1)}
                                        className="disabled:opacity-30"
                                        aria-label="Move down"
                                    >
                                        <ChevronDown className="size-4" />
                                    </button>
                                </div>
                                <span className="font-medium">{category.name}</span>
                                {!category.is_active && <Badge variant="secondary">Inactive</Badge>}
                                {category.created_by !== null && <Badge variant="outline">Seller-added</Badge>}
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={category.is_active}
                                    onCheckedChange={() => toggleActive(category)}
                                    aria-label="Active"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget(category)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                        );
                    })}
                    {visibleCategories.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                            {categories.length === 0 ? 'No categories yet.' : 'No categories match your search.'}
                        </p>
                    )}
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="new_category_name">Name</Label>
                            <Input
                                id="new_category_name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" disabled={!newName || busy} onClick={createCategory}>
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
                                This removes the category from all products. This cannot be undone.
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
