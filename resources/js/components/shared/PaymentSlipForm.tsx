import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
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
 */
export default function PaymentSlipForm({ payableType, payableId, amount, onSubmitted }: Props) {
    const [accounts, setAccounts] = useState<AdminBankAccount[]>([]);
    const [accountId, setAccountId] = useState<number | null>(null);
    const [reference, setReference] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get<AdminBankAccount[]>('/admin-bank-accounts').then((data) => {
            setAccounts(data);
            setAccountId(data[0]?.id ?? null);
        });
    }, []);

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
            const apiError = err as { errors?: Record<string, string[]> };
            setErrors(apiError.errors ?? {});
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Pay by bank transfer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Transfer <span className="font-medium">${amount.toFixed(2)}</span> to one of the accounts below,
                    then upload your payment slip. An admin will verify it shortly.
                </p>

                <div className="space-y-2">
                    <Label>Bank account</Label>
                    {accounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Loading bank accounts…</p>
                    ) : (
                        <div className="space-y-2">
                            {accounts.map((account) => (
                                <label
                                    key={account.id}
                                    className="flex min-h-11 items-start gap-2 rounded-md border p-3 text-sm"
                                >
                                    <input
                                        type="radio"
                                        name="admin_bank_account_id"
                                        checked={accountId === account.id}
                                        onChange={() => setAccountId(account.id)}
                                        className="mt-1"
                                    />
                                    <span>
                                        <span className="block font-medium">{account.bank_name}</span>
                                        <span className="block text-muted-foreground">
                                            {account.account_name} · {account.account_number}
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
                    <Label htmlFor="payment_reference">Bank reference (optional)</Label>
                    <Input
                        id="payment_reference"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="payment_slip">Payment slip (image or PDF)</Label>
                    <Input
                        id="payment_slip"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        aria-invalid={Boolean(errors.slip)}
                    />
                    {errors.slip && <p className="text-sm text-destructive">{errors.slip[0]}</p>}
                </div>

                <Button
                    type="button"
                    className="w-full min-h-11"
                    disabled={!accountId || !file || submitting}
                    onClick={submit}
                >
                    {submitting ? 'Submitting…' : 'Submit payment slip'}
                </Button>
            </CardContent>
        </Card>
    );
}
