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
import { api } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import type { BillingCycle, SubscriptionPlan } from '@/types/subscriptionPlan';

interface Props {
    plans: SubscriptionPlan[];
}

interface PlanFormState {
    name: string;
    price: string;
    billing_cycle: BillingCycle;
    listing_limit: string;
}

const emptyForm: PlanFormState = { name: '', price: '', billing_cycle: 'monthly', listing_limit: '' };

export default function AdminSubscriptionPlans({ plans: initial }: Props) {
    const [plans, setPlans] = useState([...initial].sort((a, b) => a.sort_order - b.sort_order));
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<PlanFormState>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
    const [migrateTo, setMigrateTo] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    async function createPlan() {
        setBusy(true);
        setErrors({});
        try {
            const created = await api.post<SubscriptionPlan>('/admin/subscription-plans', {
                name: form.name,
                price: Number(form.price) || 0,
                billing_cycle: Number(form.price) === 0 ? null : form.billing_cycle,
                listing_limit: form.listing_limit === '' ? null : Number(form.listing_limit),
            });
            setPlans((prev) => [...prev, created]);
            setFormOpen(false);
            setForm(emptyForm);
        } catch (err) {
            setErrors((err as ApiError).errors ?? {});
        } finally {
            setBusy(false);
        }
    }

    async function toggleActive(plan: SubscriptionPlan) {
        const updated = await api.patch<SubscriptionPlan>(`/admin/subscription-plans/${plan.id}/toggle`);
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }

    async function remove() {
        if (!deleteTarget) return;
        setBusy(true);
        setErrors({});
        try {
            await api.delete(
                `/admin/subscription-plans/${deleteTarget.id}${migrateTo ? `?migrate_to=${migrateTo}` : ''}`,
            );
            setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            setDeleteTarget(null);
            setMigrateTo(null);
        } catch (err) {
            setErrors((err as ApiError).errors ?? {});
        } finally {
            setBusy(false);
        }
    }

    async function move(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= plans.length) return;

        const reordered = [...plans];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        setPlans(reordered);

        await api.patch('/admin/subscription-plans/reorder', { order: reordered.map((p) => p.id) });
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold">Subscription plans</h1>
                    <Button type="button" onClick={() => setFormOpen(true)}>
                        Add plan
                    </Button>
                </div>

                <div className="divide-y rounded-lg border">
                    {plans.map((plan, index) => (
                        <div key={plan.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => move(index, -1)}
                                        className="disabled:opacity-30"
                                        aria-label="Move up"
                                    >
                                        <ChevronUp className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === plans.length - 1}
                                        onClick={() => move(index, 1)}
                                        className="disabled:opacity-30"
                                        aria-label="Move down"
                                    >
                                        <ChevronDown className="size-4" />
                                    </button>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{plan.name}</span>
                                        {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                                        {plan.price === 0 && <Badge variant="outline">Free</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {plan.price === 0
                                            ? 'Free'
                                            : `$${plan.price}/${plan.billing_cycle === 'annual' ? 'yr' : 'mo'}`}
                                        {' · '}
                                        {plan.listing_limit === null ? 'Unlimited listings' : `${plan.listing_limit} listings`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={plan.is_active}
                                    onCheckedChange={() => toggleActive(plan)}
                                    aria-label="Active"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget(plan)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                    {plans.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No plans yet.</p>
                    )}
                </div>

                <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add plan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="plan_name">Name</Label>
                                <Input
                                    id="plan_name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plan_price">Price (0 = free)</Label>
                                <Input
                                    id="plan_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                />
                                {errors.price && <p className="text-sm text-destructive">{errors.price[0]}</p>}
                            </div>
                            {Number(form.price) > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="plan_cycle">Billing cycle</Label>
                                    <select
                                        id="plan_cycle"
                                        value={form.billing_cycle ?? 'monthly'}
                                        onChange={(e) => setForm({ ...form, billing_cycle: e.target.value as BillingCycle })}
                                        className="border-input min-h-11 w-full rounded-md border bg-transparent px-3 text-sm"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="annual">Annual</option>
                                    </select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="plan_limit">Listing limit (blank = unlimited)</Label>
                                <Input
                                    id="plan_limit"
                                    type="number"
                                    min="0"
                                    value={form.listing_limit}
                                    onChange={(e) => setForm({ ...form, listing_limit: e.target.value })}
                                />
                                {errors.listing_limit && (
                                    <p className="text-sm text-destructive">{errors.listing_limit[0]}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" disabled={!form.name || busy} onClick={createPlan}>
                                Add
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeleteTarget(null);
                            setMigrateTo(null);
                            setErrors({});
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                                If sellers are actively subscribed to this plan, choose a plan to migrate them to
                                first.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {errors.migrate_to && (
                            <div className="space-y-2">
                                <p className="text-sm text-destructive">{errors.migrate_to[0]}</p>
                                <select
                                    value={migrateTo ?? ''}
                                    onChange={(e) => setMigrateTo(e.target.value ? Number(e.target.value) : null)}
                                    className="border-input min-h-11 w-full rounded-md border bg-transparent px-3 text-sm"
                                >
                                    <option value="">Choose a migration target…</option>
                                    {plans
                                        .filter((p) => p.id !== deleteTarget?.id)
                                        .map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
