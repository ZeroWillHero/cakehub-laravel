import { useState, type ChangeEvent, type SubmitEventHandler } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AddressMapPicker from '@/components/shared/AddressMapPicker';
import SellerLayout from '@/Layouts/SellerLayout';
import { api } from '@/lib/api';
import type { Seller } from '@/types/seller';
import type { DocumentType, SellerDocument } from '@/types/sellerDocument';

interface Props {
    seller: Seller;
}

const documentLabel: Record<DocumentType, string> = {
    business_registration: 'Business registration',
    food_safety_cert: 'Food safety certificate',
    address_proof: 'Address proof',
};

const statusVariant: Record<SellerDocument['status'], 'default' | 'secondary' | 'destructive'> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
};

function SellerImageUpload({
    label,
    endpoint,
    url: initialUrl,
    aspect,
}: {
    label: string;
    endpoint: string;
    url: string | null;
    aspect: string;
}) {
    const [url, setUrl] = useState(initialUrl);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function upload(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const updated = await api.upload<Seller>(endpoint, formData);
            setUrl(endpoint.endsWith('logo') ? updated.logo_url : updated.cover_url);
        } catch (err) {
            const apiError = err as { message?: string };
            setError(apiError.message ?? 'Upload failed.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {url ? (
                <img src={url} alt={label} className={`w-full rounded-lg border object-cover ${aspect}`} />
            ) : (
                <div className={`flex w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground ${aspect}`}>
                    No {label.toLowerCase()} uploaded
                </div>
            )}
            <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                disabled={uploading}
                onChange={upload}
                className="text-sm"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function DocumentUpload({ documents: initialDocuments }: { documents: SellerDocument[] }) {
    const [documents, setDocuments] = useState(initialDocuments);
    const [type, setType] = useState<DocumentType>('business_registration');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function upload(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('type', type);
        formData.append('file', file);

        try {
            const created = await api.upload<SellerDocument>('/seller/documents', formData);
            setDocuments((prev) => [...prev, created]);
        } catch (err) {
            const apiError = err as { message?: string };
            setError(apiError.message ?? 'Upload failed.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Verification documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {documents.length > 0 && (
                    <ul className="space-y-2">
                        {documents.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between text-sm">
                                <span>{documentLabel[doc.type]}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant={statusVariant[doc.status]}>{doc.status}</Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="document_type">Document type</Label>
                        <select
                            id="document_type"
                            value={type}
                            onChange={(e) => setType(e.target.value as DocumentType)}
                            className="border-input min-h-11 rounded-md border bg-transparent px-3 text-sm"
                        >
                            {Object.entries(documentLabel).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="document_file">Upload file (PDF or image)</Label>
                        <input
                            id="document_file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={uploading}
                            onChange={upload}
                            className="text-sm"
                        />
                    </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
        </Card>
    );
}

export default function StoreProfile({ seller: initialSeller }: Props) {
    const [form, setForm] = useState({
        business_name: initialSeller.business_name,
        description: initialSeller.description ?? '',
        whatsapp_number: initialSeller.whatsapp_number,
        address_line: initialSeller.address_line ?? '',
        latitude: initialSeller.latitude,
        longitude: initialSeller.longitude,
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
        <SellerLayout breadcrumb={['Store Profile']}>
            <div className="mx-auto w-full max-w-2xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Logo & cover photo</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SellerImageUpload
                            label="Logo"
                            endpoint="/seller/profile/logo"
                            url={initialSeller.logo_url}
                            aspect="aspect-square"
                        />
                        <SellerImageUpload
                            label="Cover photo"
                            endpoint="/seller/profile/cover"
                            url={initialSeller.cover_url}
                            aspect="aspect-video"
                        />
                    </CardContent>
                </Card>

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
                            <div className="space-y-2">
                                <Label>Store location</Label>
                                <AddressMapPicker
                                    latitude={form.latitude}
                                    longitude={form.longitude}
                                    onChange={(latitude, longitude, label) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            latitude,
                                            longitude,
                                            address_line: label ?? prev.address_line,
                                        }))
                                    }
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

                <DocumentUpload documents={initialSeller.documents ?? []} />
            </div>
        </SellerLayout>
    );
}
