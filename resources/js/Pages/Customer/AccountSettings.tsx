import { useState, type SubmitEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { api } from '@/lib/api';
import type { Address } from '@/types/address';
import type { AuthUser } from '@/types/user';

interface Props {
    user: AuthUser;
    addresses: Address[];
}

const emptyForm = { label: '', line1: '', line2: '', city: '', postal_code: '' };

export default function AccountSettings({ user, addresses: initialAddresses }: Props) {
    const [addresses, setAddresses] = useState(initialAddresses);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);

    const submit: SubmitEventHandler = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const created = await api.post<Address>('/addresses', form);
            setAddresses((prev) => [...prev, created]);
            setForm(emptyForm);
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]> };
            setErrors(apiError.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    async function remove(id: number) {
        await api.delete(`/addresses/${id}`);
        setAddresses((prev) => prev.filter((a) => a.id !== id));
    }

    return (
        <CustomerLayout>
            <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading">Saved addresses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {addresses.length === 0 && (
                            <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
                        )}
                        {addresses.map((address) => (
                            <div
                                key={address.id}
                                className="flex items-start justify-between gap-3 rounded-lg border p-3"
                            >
                                <div className="text-sm">
                                    <p className="font-medium">{address.label || address.line1}</p>
                                    <p className="text-muted-foreground">
                                        {address.line1}, {address.city}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-11 sm:min-h-8"
                                    onClick={() => remove(address.id)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}

                        <form onSubmit={submit} className="space-y-3 border-t pt-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="label">Label</Label>
                                    <Input
                                        id="label"
                                        value={form.label}
                                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                        aria-invalid={Boolean(errors.city)}
                                    />
                                    {errors.city && <p className="text-sm text-destructive">{errors.city[0]}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="line1">Address line</Label>
                                <Input
                                    id="line1"
                                    value={form.line1}
                                    onChange={(e) => setForm({ ...form, line1: e.target.value })}
                                    aria-invalid={Boolean(errors.line1)}
                                />
                                {errors.line1 && <p className="text-sm text-destructive">{errors.line1[0]}</p>}
                            </div>
                            <Button type="submit" disabled={saving} className="w-full min-h-11 sm:w-auto">
                                {saving ? 'Saving…' : 'Add address'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
