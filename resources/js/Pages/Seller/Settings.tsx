import { useState, type SubmitEventHandler } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Spinner from '@/components/shared/Spinner';
import SellerLayout from '@/Layouts/SellerLayout';
import { api } from '@/lib/api';
import { router } from '@inertiajs/react';
import type { NotificationPreferences } from '@/types/user';
import type { Seller } from '@/types/seller';

interface Props {
    seller: Seller;
    notificationPreferences: NotificationPreferences | null;
}

export default function Settings({ seller, notificationPreferences }: Props) {
    const [prefs, setPrefs] = useState({
        order_status_email: notificationPreferences?.order_status?.email ?? true,
        seller_verification_email: notificationPreferences?.seller_verification?.email ?? true,
        subscription_status_email: notificationPreferences?.subscription_status?.email ?? true,
    });
    const [savingPrefs, setSavingPrefs] = useState(false);

    const [payout, setPayout] = useState({
        payout_bank_name: seller.payout_bank_name ?? '',
        payout_account_name: seller.payout_account_name ?? '',
        payout_account_number: seller.payout_account_number ?? '',
    });
    const [payoutErrors, setPayoutErrors] = useState<Record<string, string[]>>({});
    const [savingPayout, setSavingPayout] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);

    async function togglePref(key: keyof typeof prefs, value: boolean) {
        const next = { ...prefs, [key]: value };
        setPrefs(next);
        setSavingPrefs(true);
        try {
            await api.put('/settings/notifications', next);
        } finally {
            setSavingPrefs(false);
        }
    }

    const savePayout: SubmitEventHandler = async (e) => {
        e.preventDefault();
        setSavingPayout(true);
        setPayoutErrors({});
        try {
            await api.put('/seller/settings/payout', payout);
        } catch (err) {
            const apiError = err as { errors?: Record<string, string[]> };
            setPayoutErrors(apiError.errors ?? {});
        } finally {
            setSavingPayout(false);
        }
    };

    async function deactivate() {
        setDeactivating(true);
        try {
            await api.post('/settings/deactivate');
            router.visit('/');
        } finally {
            setDeactivating(false);
        }
    }

    return (
        <SellerLayout breadcrumb={['Settings']}>
            <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading">Notification preferences</CardTitle>
                        <CardDescription>Choose which updates you get by email. In-app notifications always continue.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="order_status_email" className="font-normal">
                                Order status updates
                            </Label>
                            <Switch
                                id="order_status_email"
                                checked={prefs.order_status_email}
                                onCheckedChange={(v) => togglePref('order_status_email', v)}
                                disabled={savingPrefs}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="seller_verification_email" className="font-normal">
                                Seller verification updates
                            </Label>
                            <Switch
                                id="seller_verification_email"
                                checked={prefs.seller_verification_email}
                                onCheckedChange={(v) => togglePref('seller_verification_email', v)}
                                disabled={savingPrefs}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="subscription_status_email" className="font-normal">
                                Subscription status updates
                            </Label>
                            <Switch
                                id="subscription_status_email"
                                checked={prefs.subscription_status_email}
                                onCheckedChange={(v) => togglePref('subscription_status_email', v)}
                                disabled={savingPrefs}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading">Payout details</CardTitle>
                        <CardDescription>
                            Used for future payouts. Payments aren't processed through CakeHub yet — these details are stored for when that launches.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={savePayout} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="payout_bank_name">Bank name</Label>
                                <Input
                                    id="payout_bank_name"
                                    value={payout.payout_bank_name}
                                    onChange={(e) => setPayout((p) => ({ ...p, payout_bank_name: e.target.value }))}
                                />
                                {payoutErrors.payout_bank_name && (
                                    <p className="text-sm text-destructive">{payoutErrors.payout_bank_name[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payout_account_name">Account holder name</Label>
                                <Input
                                    id="payout_account_name"
                                    value={payout.payout_account_name}
                                    onChange={(e) => setPayout((p) => ({ ...p, payout_account_name: e.target.value }))}
                                />
                                {payoutErrors.payout_account_name && (
                                    <p className="text-sm text-destructive">{payoutErrors.payout_account_name[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payout_account_number">Account number</Label>
                                <Input
                                    id="payout_account_number"
                                    value={payout.payout_account_number}
                                    onChange={(e) => setPayout((p) => ({ ...p, payout_account_number: e.target.value }))}
                                />
                                {payoutErrors.payout_account_number && (
                                    <p className="text-sm text-destructive">{payoutErrors.payout_account_number[0]}</p>
                                )}
                            </div>
                            <Button type="submit" disabled={savingPayout} className="min-h-11 sm:min-h-9">
                                {savingPayout && <Spinner className="mr-2" />}
                                Save payout details
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="font-heading">Deactivate account</CardTitle>
                        <CardDescription>
                            This will sign you out and disable sign-in until you contact support to reactivate.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="destructive"
                            className="min-h-11 sm:min-h-9"
                            onClick={() => setConfirmDeactivate(true)}
                        >
                            Deactivate account
                        </Button>
                        <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You'll be signed out immediately and won't be able to sign back in until your account is
                                        reactivated. Your storefront and listings will remain but won't be reachable while deactivated.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={deactivate} disabled={deactivating}>
                                        {deactivating && <Spinner className="mr-2" />}
                                        Deactivate
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </SellerLayout>
    );
}
