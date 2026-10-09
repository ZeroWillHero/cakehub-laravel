import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminDashboard from '@/Pages/Admin/Dashboard';

vi.mock('@/Layouts/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
    router: { reload: vi.fn() },
}));

// Recharts needs real layout measurements jsdom doesn't provide.
vi.mock('@/components/shared/OrdersAreaChart', () => ({ default: () => null }));
vi.mock('@/components/shared/StatusBreakdownChart', () => ({ default: () => null }));

const analytics = {
    range: 30 as const,
    ordersOverTime: [],
    newSellersOverTime: [],
    statusBreakdown: { placed: 0, confirmed: 0, preparing: 0, ready: 0, delivered: 0, completed: 0, cancelled: 0 },
};

describe('Admin Dashboard', () => {
    it('links each stat card to the page that lists those records', () => {
        render(
            <AdminDashboard
                metrics={{ customers: 42, sellers: 9, orders: 130, pending_verifications: 2 }}
                analytics={analytics}
            />,
        );

        const cards: [RegExp, string][] = [
            [/Customers\s*42/, '/admin/users?tab=customers'],
            [/Sellers\s*9/, '/admin/users?tab=sellers'],
            [/Orders\s*130/, '/admin/orders'],
            [/Pending verifications\s*2/, '/admin/sellers/pending'],
        ];

        for (const [name, href] of cards) {
            expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
        }
    });
});
