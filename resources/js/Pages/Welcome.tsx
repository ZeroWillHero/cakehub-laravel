import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { cn } from '@/lib/utils';

export default function Welcome() {
    return (
        <CustomerLayout>
            <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6">
                <ImagePlaceholder
                    label="Hero cake photography"
                    className="aspect-[4/3] w-full max-w-sm sm:max-w-md"
                />
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="font-heading text-3xl font-semibold">CakeHub</CardTitle>
                        <CardDescription>
                            Find local cake sellers by category and location, or list your own bakery.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <a
                            href="/auth/google/redirect"
                            className={cn(buttonVariants({ size: 'lg' }), 'w-full min-h-11')}
                        >
                            Continue with Google
                        </a>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
