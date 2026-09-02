import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

/**
 * Wraps every Customer-facing page in the warm bakery theme (see
 * resources/css/app.css `.customer-theme` and
 * docs/skills/frontend-design-skill.md). Seller/Admin pages do not use
 * this layout and keep the default shadcn palette.
 */
export default function CustomerLayout({ children }: Props) {
    return <div className="customer-theme min-h-screen bg-background text-foreground">{children}</div>;
}
