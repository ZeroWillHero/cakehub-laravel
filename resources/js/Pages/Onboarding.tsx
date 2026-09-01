import { useForm } from '@inertiajs/react';
import { useState, type SubmitEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    name: string;
}

type Role = 'customer' | 'seller';

export default function Onboarding({ name }: Props) {
    const [role, setRole] = useState<Role>('customer');
    const { data, setData, post, processing, errors } = useForm({
        role: 'customer' as Role,
        business_name: '',
        whatsapp_number: '',
    });

    function selectRole(next: Role) {
        setRole(next);
        setData('role', next);
    }

    const submit: SubmitEventHandler = (e) => {
        e.preventDefault();
        post('/onboarding');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-xl">Welcome, {name}</CardTitle>
                    <CardDescription>Tell us how you'll use CakeHub.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => selectRole('customer')}
                                aria-pressed={role === 'customer'}
                                className={`rounded-lg border p-4 text-left transition-colors min-h-11 ${
                                    role === 'customer' ? 'border-primary bg-primary/5' : 'border-border'
                                }`}
                            >
                                <p className="font-medium">I'm buying cakes</p>
                                <p className="text-sm text-muted-foreground">Browse and order from local sellers</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => selectRole('seller')}
                                aria-pressed={role === 'seller'}
                                className={`rounded-lg border p-4 text-left transition-colors min-h-11 ${
                                    role === 'seller' ? 'border-primary bg-primary/5' : 'border-border'
                                }`}
                            >
                                <p className="font-medium">I sell cakes</p>
                                <p className="text-sm text-muted-foreground">List your bakery and manage orders</p>
                            </button>
                        </div>

                        {role === 'seller' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="business_name">Business name</Label>
                                    <Input
                                        id="business_name"
                                        value={data.business_name}
                                        onChange={(e) => setData('business_name', e.target.value)}
                                        aria-invalid={Boolean(errors.business_name)}
                                    />
                                    {errors.business_name && (
                                        <p className="text-sm text-destructive">{errors.business_name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp_number">WhatsApp number</Label>
                                    <Input
                                        id="whatsapp_number"
                                        value={data.whatsapp_number}
                                        onChange={(e) => setData('whatsapp_number', e.target.value)}
                                        placeholder="+1 555 123 4567"
                                        aria-invalid={Boolean(errors.whatsapp_number)}
                                    />
                                    {errors.whatsapp_number && (
                                        <p className="text-sm text-destructive">{errors.whatsapp_number}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full min-h-11" disabled={processing}>
                            {processing ? 'Saving…' : 'Continue'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
