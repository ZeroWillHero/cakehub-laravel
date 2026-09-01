import { useState, type SubmitEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { Seller } from '@/types/seller';

interface Props {
    seller: Seller;
}

export default function StoreProfile({ seller: initialSeller }: Props) {
    const [form, setForm] = useState({
        business_name: initialSeller.business_name,
        description: initialSeller.description ?? '',
        whatsapp_number: initialSeller.whatsapp_number,
        address_line: initialSeller.address_line ?? '',
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const submit: SubmitEventHandler = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setSaved(false);
        try {
            await api.put<Seller>('/seller/profile', form);
            setSaved(true);
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]> };
            setErrors(apiError.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Store profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="business_name">Business name</Label>
                                <Input
                                    id="business_name"
                                    value={form.business_name}
                                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                                    aria-invalid={Boolean(errors.business_name)}
                                />
                                {errors.business_name && (
                                    <p className="text-sm text-destructive">{errors.business_name[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp_number">WhatsApp number</Label>
                                <Input
                                    id="whatsapp_number"
                                    value={form.whatsapp_number}
                                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                                    aria-invalid={Boolean(errors.whatsapp_number)}
                                />
                                {errors.whatsapp_number && (
                                    <p className="text-sm text-destructive">{errors.whatsapp_number[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address_line">Address</Label>
                                <Input
                                    id="address_line"
                                    value={form.address_line}
                                    onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button type="submit" disabled={saving} className="min-h-11">
                                    {saving ? 'Saving…' : 'Save changes'}
                                </Button>
                                {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
