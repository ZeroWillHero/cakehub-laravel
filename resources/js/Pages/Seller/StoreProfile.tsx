import { useState, type SubmitEventHandler } from 'react';
import { CheckCircle2, Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AddressMapPicker from '@/components/shared/AddressMapPicker';
import FileDropzone from '@/components/shared/FileDropzone';
import ImageUploadField from '@/components/shared/ImageUploadField';
import ProgressBar from '@/components/shared/ProgressBar';
import SlipPreviewDialog from '@/components/shared/SlipPreviewDialog';
import Spinner from '@/components/shared/Spinner';
import SellerLayout from '@/Layouts/SellerLayout';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { DOCUMENT_RULE } from '@/lib/files';
import { statusTone } from '@/lib/statusTone';
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

const documentStatusLabel: Record<SellerDocument['status'], string> = {
    pending: 'Under review',
    approved: 'Approved',
    rejected: 'Rejected',
};

function uploadSellerImage(endpoint: string, field: 'logo_url' | 'cover_url') {
    return async (file: File, onProgress: (percent: number) => void) => {
        const formData = new FormData();
        formData.append('image', file);
        const updated = await api.upload<Seller>(endpoint, formData, { onProgress });
        return updated[field];
    };
}

function DocumentUpload({ documents: initialDocuments }: { documents: SellerDocument[] }) {
    const [documents, setDocuments] = useState(initialDocuments);
    const [type, setType] = useState<DocumentType>('business_registration');
    const [progress, setProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [justUploaded, setJustUploaded] = useState<string | null>(null);
    const [viewing, setViewing] = useState<SellerDocument | null>(null);

    async function upload(file: File) {
        setProgress(0);
        setError(null);
        setJustUploaded(null);
        const formData = new FormData();
        formData.append('type', type);
        formData.append('file', file);

        try {
            const created = await api.upload<SellerDocument>('/seller/documents', formData, { onProgress: setProgress });
            setDocuments((prev) => [...prev, created]);
            setJustUploaded(documentLabel[type]);
        } catch (err) {
            setError(errorMessage(err, 'file', 'Upload failed. Please try again.'));
        } finally {
            setProgress(null);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Verification documents</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Upload these so our team can verify your business. Clear photos or scans work fine.
                </p>
            </CardHeader>
            <CardContent className="space-y-5">
                {documents.length > 0 && (
                    <ul className="divide-y rounded-lg border">
                        {documents.map((doc) => (
                            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <FileText className="size-4" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-medium">{documentLabel[doc.type]}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Uploaded {new Date(doc.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        {doc.status === 'rejected' && doc.rejection_reason && (
                                            <p className="text-xs text-destructive">Reason: {doc.rejection_reason}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={statusTone(doc.status)}>{documentStatusLabel[doc.status]}</Badge>
                                    <Button type="button" variant="outline" size="sm" className="min-h-9" onClick={() => setViewing(doc)}>
                                        <Eye aria-hidden="true" />
                                        View
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="space-y-3 rounded-lg border p-4">
                    <div className="space-y-2">
                        <Label htmlFor="document_type">1. What are you uploading?</Label>
                        <Select value={type} onValueChange={(v) => setType(v as DocumentType)} disabled={progress !== null}>
                            <SelectTrigger id="document_type" className="min-h-11 w-full sm:w-72">
                                <SelectValue>{(value: DocumentType) => documentLabel[value]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(documentLabel).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">2. Choose the file</p>
                        {progress !== null ? (
                            <div className="space-y-2 rounded-xl border-2 border-dashed p-6 text-center" role="status">
                                <p className="text-sm font-medium">Uploading {documentLabel[type].toLowerCase()}… {progress}%</p>
                                <ProgressBar value={progress} label="Uploading document" className="bg-muted" />
                            </div>
                        ) : (
                            <FileDropzone
                                id="document_file"
                                label={`Upload ${documentLabel[type].toLowerCase()}`}
                                rule={DOCUMENT_RULE}
                                onFiles={([file]) => upload(file)}
                                error={error}
                            />
                        )}
                    </div>
                    {justUploaded && (
                        <p className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400" role="status">
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            {justUploaded} uploaded — we&apos;ll review it soon.
                        </p>
                    )}
                </div>
            </CardContent>

            <SlipPreviewDialog
                open={viewing !== null}
                onOpenChange={(open) => !open && setViewing(null)}
                slipUrl={viewing ? `/seller-documents/${viewing.id}` : ''}
                title={viewing ? documentLabel[viewing.type] : 'Document'}
            />
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
            const apiError = err as { errors?: Record<string, string[]>; message?: string };
            setErrors(apiError.errors ?? { form: [apiError.message ?? 'Could not save. Please try again.'] });
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
                        <p className="text-sm text-muted-foreground">
                            These appear at the top of your storefront. Changes are saved as soon as the upload finishes.
                        </p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_2fr]">
                        <ImageUploadField
                            label="Logo"
                            url={initialSeller.logo_url}
                            upload={uploadSellerImage('/seller/profile/logo', 'logo_url')}
                            aspect="aspect-square"
                            hint="Square image works best."
                        />
                        <ImageUploadField
                            label="Cover photo"
                            url={initialSeller.cover_url}
                            upload={uploadSellerImage('/seller/profile/cover', 'cover_url')}
                            aspect="aspect-[3/1]"
                            hint="Wide landscape photo, e.g. 1500 × 500px."
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
                                <Label htmlFor="description">About your store</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Tell customers what you bake and what makes your cakes special."
                                    rows={3}
                                    aria-invalid={Boolean(errors.description)}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp_number">WhatsApp number</Label>
                                <Input
                                    id="whatsapp_number"
                                    value={form.whatsapp_number}
                                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                                    type="tel"
                                    inputMode="tel"
                                    placeholder="e.g. +94 77 123 4567"
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
                            <div className="flex flex-wrap items-center gap-3">
                                <Button type="submit" disabled={saving} className="min-h-11">
                                    {saving && <Spinner className="mr-2" />}
                                    {saving ? 'Saving…' : 'Save changes'}
                                </Button>
                                {saved && (
                                    <span className="inline-flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400" role="status">
                                        <CheckCircle2 className="size-4" aria-hidden="true" />
                                        Your store profile has been saved.
                                    </span>
                                )}
                                {errors.form && <span className="text-sm text-destructive">{errors.form[0]}</span>}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <DocumentUpload documents={initialSeller.documents ?? []} />
            </div>
        </SellerLayout>
    );
}
