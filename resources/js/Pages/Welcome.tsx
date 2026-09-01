import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function Welcome() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-semibold">CakeHub</CardTitle>
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
    );
}
