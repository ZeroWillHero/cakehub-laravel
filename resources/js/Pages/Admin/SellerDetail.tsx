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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Eye, FileText } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import SlipPreviewDialog from '@/components/shared/SlipPreviewDialog';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { api } from '@/lib/api';
import { statusTone } from '@/lib/statusTone';
import type { Seller, VerificationStatus } from '@/types/seller';
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
    pending: 'Pending review',
    approved: 'Approved',
    rejected: 'Rejected',
};

const statusVariant: Record<VerificationStatus, 'default' | 'secondary' | 'destructive'> = {
    pending: 'secondary',
    verified: 'default',
    rejected: 'destructive',
    suspended: 'destructive',
};

export default function SellerDetail({ seller: initialSeller }: Props) {
    const [seller, setSeller] = useState(initialSeller);
    const [confirmVerify, setConfirmVerify] = useState(false);
    const [confirmSuspend, setConfirmSuspend] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [infoOpen, setInfoOpen] = useState(false);
    const [infoMessage, setInfoMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<SellerDocument | null>(null);

    async function verify() {
        setBusy(true);
        try {
            setSeller(await api.post<Seller>(`/admin/sellers/${seller.id}/verify`));
            setConfirmVerify(false);
            toast.success('Seller verified.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't verify the seller."));
        } finally {
            setBusy(false);
        }
    }

    async function reject() {
        setBusy(true);
        try {
            setSeller(await api.post<Seller>(`/admin/sellers/${seller.id}/reject`, { reason: rejectReason }));
            setRejectOpen(false);
            setRejectReason('');
            toast.success('Seller rejected.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't reject the seller."));
        } finally {
            setBusy(false);
        }
    }

    async function requestInfo() {
        setBusy(true);
        try {
            await api.post(`/admin/sellers/${seller.id}/request-info`, { message: infoMessage });
            setInfoOpen(false);
            setInfoMessage('');
            toast.success('Message sent to the seller.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't send the message."));
        } finally {
            setBusy(false);
        }
    }

    async function suspend() {
        setBusy(true);
        try {
            setSeller(await api.post<Seller>(`/admin/sellers/${seller.id}/suspend`));
            setConfirmSuspend(false);
            toast.success('Seller suspended.');
        } catch (err) {
            toast.error(errorMessage(err, undefined, "Couldn't suspend the seller."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AdminLayout breadcrumb={['Verification Queue', seller.business_name]}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">{seller.business_name}</h1>
                <Badge variant={statusVariant[seller.verification_status]}>{seller.verification_status}</Badge>
            </div>

            <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <p>
                            <span className="text-muted-foreground">Owner:</span> {seller.user?.name} (
                            {seller.user?.email})
                        </p>
                        <p>
                            <span className="text-muted-foreground">WhatsApp:</span> {seller.whatsapp_number}
                        </p>
                        {seller.address_line && (
                            <p>
                                <span className="text-muted-foreground">Address:</span> {seller.address_line}
                            </p>
                        )}
                        {seller.description && <p className="pt-2">{seller.description}</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!seller.documents || seller.documents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No documents submitted yet.</p>
                        ) : (
                            <ul className="divide-y rounded-lg border">
                                {seller.documents.map((doc) => (
                                    <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                                        <span className="flex items-center gap-3">
                                            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted">
                                                <FileText className="size-4" aria-hidden="true" />
                                            </span>
                                            <span>
                                                <span className="block font-medium">{documentLabel[doc.type]}</span>
                                                <span className="block text-xs text-muted-foreground">
                                                    Uploaded {new Date(doc.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Badge className={statusTone(doc.status)}>{documentStatusLabel[doc.status]}</Badge>
                                            <Button type="button" variant="outline" size="sm" className="min-h-9" onClick={() => setViewingDoc(doc)}>
                                                <Eye aria-hidden="true" />
                                                View
                                            </Button>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {seller.verification_status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" disabled={busy} onClick={() => setConfirmVerify(true)}>
                            Approve
                        </Button>
                        <Button type="button" variant="outline" disabled={busy} onClick={() => setRejectOpen(true)}>
                            Reject
                        </Button>
                        <Button type="button" variant="outline" disabled={busy} onClick={() => setInfoOpen(true)}>
                            Request more info
                        </Button>
                    </div>
                )}

                {seller.verification_status !== 'suspended' && seller.verification_status !== 'pending' && (
                    <Button type="button" variant="destructive" disabled={busy} onClick={() => setConfirmSuspend(true)}>
                        Suspend seller
                    </Button>
                )}

                <AlertDialog open={confirmVerify} onOpenChange={setConfirmVerify}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Approve this seller?</AlertDialogTitle>
                            <AlertDialogDescription>
                                The seller will be verified and the verified badge will show on their storefront.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={verify}>Approve</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Suspend this seller?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Their storefront will be suspended. This can be reversed by re-verifying them later.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={suspend}>Suspend</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject verification</DialogTitle>
                        </DialogHeader>
                        <Textarea
                            placeholder="Reason (required — shown to the seller)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <DialogFooter>
                            <Button type="button" disabled={!rejectReason || busy} onClick={reject}>
                                Reject
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request more information</DialogTitle>
                        </DialogHeader>
                        <Textarea
                            placeholder="What do you need from the seller?"
                            value={infoMessage}
                            onChange={(e) => setInfoMessage(e.target.value)}
                        />
                        <DialogFooter>
                            <Button type="button" disabled={!infoMessage || busy} onClick={requestInfo}>
                                Send
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            <SlipPreviewDialog
                open={viewingDoc !== null}
                onOpenChange={(open) => !open && setViewingDoc(null)}
                slipUrl={viewingDoc ? `/seller-documents/${viewingDoc.id}` : ''}
                title={viewingDoc ? `${documentLabel[viewingDoc.type]} — ${seller.business_name}` : 'Document'}
            />
        </AdminLayout>
    );
}
