import CustomerLayout from '@/Layouts/CustomerLayout';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';

export default function CustomerHome() {
    return (
        <CustomerLayout>
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="font-heading text-3xl font-semibold">Find your next cake</h1>
                <p className="mt-2 text-muted-foreground">
                    Category browsing and nearby search land in a later phase (see docs/plan.md Phase 3).
                </p>
                <ImagePlaceholder label="Featured cakes" className="mt-6 aspect-[16/6] w-full" />
            </div>
        </CustomerLayout>
    );
}
