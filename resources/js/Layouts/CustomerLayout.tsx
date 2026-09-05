import type { ReactNode } from 'react';
import SiteHeader from '@/components/shared/SiteHeader';
import SiteFooter from '@/components/shared/SiteFooter';

interface Props {
    children: ReactNode;
}

/**
 * Wraps every Customer-facing page in the warm bakery theme (see
 * resources/css/app.css `.customer-theme` and
 * docs/skills/frontend-design-skill.md), plus the shared site header/footer.
 * Seller/Admin pages do not use this layout and keep the default shadcn
 * palette.
 */
export default function CustomerLayout({ children }: Props) {
    return (
        <div className="customer-theme flex min-h-screen flex-col bg-background text-foreground">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
        </div>
    );
}
