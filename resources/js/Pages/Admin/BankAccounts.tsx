import { useState } from 'react';
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
import type { AdminBankAccount } from '@/types/adminBankAccount';

interface Props {
    accounts: AdminBankAccount[];
}

const emptyForm = { bank_name: '', account_name: '', account_number: '', branch: '' };

export default function AdminBankAccounts({ accounts: initial }: Props) {
    const [accounts, setAccounts] = useState(
        [...initial].sort((a, b) => a.sort_order - b.sort_order),
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<AdminBankAccount | null>(null);
    const [busy, setBusy] = useState(false);

    async function createAccount() {
        setBusy(true);
        try {
            const created = await api.post<AdminBankAccount>('/admin/bank-accounts', form);
            setAccounts((prev) => [...prev, created]);
            setCreateOpen(false);
            setForm(emptyForm);
        } finally {
            setBusy(false);
        }
    }

    async function toggleActive(account: AdminBankAccount) {
        const updated = await api.patch<AdminBankAccount>(`/admin/bank-accounts/${account.id}/toggle`);
        setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }

    async function remove() {
        if (!deleteTarget) return;
        setBusy(true);
        try {
            await api.delete(`/admin/bank-accounts/${deleteTarget.id}`);
            setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
            setDeleteTarget(null);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Bank accounts</h1>
                    <Button type="button" onClick={() => setCreateOpen(true)}>
                        Add bank account
                    </Button>
                </div>

                <div className="divide-y rounded-lg border">
                    {accounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div>
                                <p className="font-medium">
                                    {account.bank_name}
                                    {!account.is_active && <Badge variant="secondary" className="ml-2">Inactive</Badge>}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {account.account_name} · {account.account_number}
                                    {account.branch && ` · ${account.branch}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={account.is_active}
                                    onCheckedChange={() => toggleActive(account)}
                                    aria-label="Active"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget(account)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                    {accounts.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No bank accounts yet.</p>
                    )}
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add bank account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="bank_name">Bank name</Label>
                                <Input
                                    id="bank_name"
                                    value={form.bank_name}
                                    onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_name">Account name</Label>
                                <Input
                                    id="account_name"
                                    value={form.account_name}
                                    onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_number">Account number</Label>
                                <Input
                                    id="account_number"
                                    value={form.account_number}
                                    onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branch">Branch (optional)</Label>
                                <Input
                                    id="branch"
                                    value={form.branch}
                                    onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                disabled={!form.bank_name || !form.account_name || !form.account_number || busy}
                                onClick={createAccount}
                            >
                                Add
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{deleteTarget?.bank_name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
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
