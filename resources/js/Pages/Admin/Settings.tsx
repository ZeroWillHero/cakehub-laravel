import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/Layouts/AdminLayout';
import { api } from '@/lib/api';
import type { NotificationPreferences } from '@/types/user';

interface Props {
    notificationPreferences: NotificationPreferences | null;
}

export default function Settings({ notificationPreferences }: Props) {
    const [prefs, setPrefs] = useState({
        order_status_email: notificationPreferences?.order_status?.email ?? true,
        seller_verification_email: notificationPreferences?.seller_verification?.email ?? true,
        subscription_status_email: notificationPreferences?.subscription_status?.email ?? true,
    });
    const [saving, setSaving] = useState(false);

    async function togglePref(key: keyof typeof prefs, value: boolean) {
        const next = { ...prefs, [key]: value };
        setPrefs(next);
        setSaving(true);
        try {
            await api.put('/settings/notifications', next);
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout breadcrumb={['Settings']}>
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
                                disabled={saving}
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
                                disabled={saving}
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
                                disabled={saving}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
