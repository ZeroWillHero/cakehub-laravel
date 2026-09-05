import type { ReactNode } from 'react';
import SiteHeader from '@/components/shared/SiteHeader';
import SiteFooter from '@/components/shared/SiteFooter';

interface Props {
    children: ReactNode;
}

/**
 * Wraps every Customer-facing page in the shared shadcn preset (see
 * resources/css/app.css `:root`) — the same tokens Admin and Seller use —
 * plus the shared site header/footer.
 */
export default function CustomerLayout({ children }: Props) {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
        </div>
    );
}
