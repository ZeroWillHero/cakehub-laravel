import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import FileDropzone from '@/components/shared/FileDropzone';
import SelectedFile from '@/components/shared/SelectedFile';
import Spinner from '@/components/shared/Spinner';
import { api } from '@/lib/api';
import { SLIP_RULE } from '@/lib/files';
import { cn } from '@/lib/utils';
import type { AdminBankAccount } from '@/types/adminBankAccount';
import type { Payment } from '@/types/payment';

interface Props {
    payableType: 'order' | 'subscription';
    payableId: number;
    amount: number;
    onSubmitted: (payment: Payment) => void;
}

/**
 * Manual bank-transfer payment step (Phase 8): shown after an order or
 * seller subscription is created, before it can progress — the customer/
 * seller picks which admin bank account they paid into and uploads proof.
 * Laid out as numbered steps so it reads as a simple checklist.
 */
export default function PaymentSlipForm({ payableType, payableId, amount, onSubmitted }: Props) {
    const [accounts, setAccounts] = useState<AdminBankAccount[] | null>(null);
    const [accountsFailed, setAccountsFailed] = useState(false);
    const [accountId, setAccountId] = useState<number | null>(null);
    const [reference, setReference] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    function loadAccounts() {
        setAccountsFailed(false);
        setAccounts(null);
        api.get<AdminBankAccount[]>('/admin-bank-accounts')
            .then((data) => {
                setAccounts(data);
                setAccountId(data[0]?.id ?? null);
            })
            .catch(() => setAccountsFailed(true));
    }

    useEffect(loadAccounts, []);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!accountId || !file) return;

        setSubmitting(true);
        setErrors({});

        const formData = new FormData();
        formData.append('payable_type', payableType);
        formData.append('payable_id', String(payableId));
        formData.append('amount', String(amount));
        formData.append('admin_bank_account_id', String(accountId));
        if (reference) formData.append('reference', reference);
        formData.append('slip', file);

        try {
            const payment = await api.upload<Payment>('/payments', formData);
            onSubmitted(payment);
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]>; message?: string };
            setErrors(apiError.errors ?? { form: [apiError.message ?? 'Could not submit. Please try again.'] });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Pay by bank transfer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                    Transfer <span className="font-medium text-foreground">${amount.toFixed(2)}</span> to one of the
                    accounts below, then upload your payment slip. An admin will verify it shortly.
                </p>

                <div className="space-y-2">
                    <Label>1. Choose the account you paid into</Label>
                    {accountsFailed ? (
                        <div className="rounded-lg border border-destructive/40 p-3 text-sm">
                            <p className="text-destructive">We couldn&apos;t load the bank accounts.</p>
                            <Button type="button" variant="outline" size="sm" className="mt-2 min-h-9" onClick={loadAccounts}>
                                Try again
                            </Button>
                        </div>
                    ) : accounts === null ? (
                        <div className="space-y-2" role="status" aria-label="Loading bank accounts">
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                        </div>
                    ) : accounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No bank accounts are set up yet. Please contact CakeHub support.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {accounts.map((account) => (
                                <label
                                    key={account.id}
                                    className={cn(
                                        'flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
                                        accountId === account.id
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                            : 'hover:bg-muted/50',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="admin_bank_account_id"
                                        checked={accountId === account.id}
                                        onChange={() => setAccountId(account.id)}
                                        className="mt-1 size-4 accent-primary"
                                    />
                                    <span>
                                        <span className="block font-medium">{account.bank_name}</span>
                                        <span className="block text-muted-foreground">
                                            {account.account_name} ·{' '}
                                            <span className="font-mono text-foreground">{account.account_number}</span>
                                            {account.branch && ` · ${account.branch}`}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                    {errors.admin_bank_account_id && (
                        <p className="text-sm text-destructive">{errors.admin_bank_account_id[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="payment_reference">2. Bank reference (optional)</Label>
                    <Input
                        id="payment_reference"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="The reference number on your receipt, if any"
                        className="min-h-11"
                    />
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">3. Add a photo of your payment slip</p>
                    {file ? (
                        <SelectedFile file={file} onClear={() => setFile(null)} disabled={submitting} />
                    ) : (
                        <FileDropzone
                            id="payment_slip"
                            label="Upload your payment slip"
                            rule={SLIP_RULE}
                            onFiles={([picked]) => setFile(picked)}
                            hint="A clear photo of the receipt or a screenshot of the transfer is fine."
                        />
                    )}
                    {errors.slip && <p className="text-sm text-destructive">{errors.slip[0]}</p>}
                </div>

                {errors.form && (
                    <p className="text-sm text-destructive" role="alert">
                        {errors.form[0]}
                    </p>
                )}

                <Button
                    type="button"
                    className="w-full min-h-11"
                    disabled={!accountId || !file || submitting}
                    onClick={submit}
                >
                    {submitting && <Spinner className="mr-2" />}
                    {submitting ? 'Submitting…' : 'Submit payment slip'}
                </Button>
            </CardContent>
        </Card>
    );
}
