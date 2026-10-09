import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserDetails } from '@/Pages/Admin/Users';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { AdminUser } from '@/types/adminUser';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

vi.mock('@/lib/api', () => ({
    api: { patch: vi.fn() },
}));

// UserDetails renders inside the page's Sheet; Sheet title/description need
// a Dialog root, so give them plain stand-ins for this isolated render.
vi.mock('@/components/ui/sheet', () => ({
    SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

function customer(overrides: Partial<AdminUser> = {}): AdminUser {
    return {
        id: 7,
        name: 'Asha',
        email: 'asha@example.com',
        avatar_url: null,
        role: 'customer',
        status: 'active',
        created_at: '2026-09-01T00:00:00Z',
        orders_count: 3,
        orders_total: 75,
        last_order_at: '2026-09-20T00:00:00Z',
        ...overrides,
    };
}

function seller(overrides: Partial<AdminUser> = {}): AdminUser {
    return customer({
        id: 9,
        name: 'Owner',
        role: 'seller',
        orders_count: undefined,
        orders_total: undefined,
        last_order_at: undefined,
        seller: {
            id: 4,
            business_name: 'Cake Corner',
            slug: 'cake-corner',
            verification_status: 'verified',
            products_count: 5,
            orders_count: 12,
        },
        ...overrides,
    });
}

describe('Admin Users — account details', () => {
    beforeEach(() => {
        vi.mocked(api.patch).mockReset();
    });

    it('asks for confirmation before suspending, then suspends and reports back', async () => {
        const onUpdated = vi.fn();
        vi.mocked(api.patch).mockResolvedValue(customer({ status: 'suspended' }));
        render(<UserDetails user={customer()} onUpdated={onUpdated} />);

        await userEvent.click(screen.getByRole('button', { name: 'Suspend account' }));
        expect(api.patch).not.toHaveBeenCalled();
        expect(await screen.findByText("Suspend Asha's account?")).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Suspend' }));

        await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/admin/users/7/suspend'));
        expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: 'suspended' }));
    });

    it('reports a failed suspend and leaves the row unchanged', async () => {
        const onUpdated = vi.fn();
        const error = vi.spyOn(toast, 'error').mockImplementation(() => {});
        vi.mocked(api.patch).mockRejectedValue({ message: "This account isn't active." });
        render(<UserDetails user={customer()} onUpdated={onUpdated} />);

        await userEvent.click(screen.getByRole('button', { name: 'Suspend account' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Suspend' }));

        await waitFor(() => expect(error).toHaveBeenCalledWith("This account isn't active."));
        expect(onUpdated).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('does nothing when the confirmation is cancelled', async () => {
        render(<UserDetails user={customer()} onUpdated={vi.fn()} />);

        await userEvent.click(screen.getByRole('button', { name: 'Suspend account' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        expect(api.patch).not.toHaveBeenCalled();
    });

    it('reactivates a suspended account', async () => {
        vi.mocked(api.patch).mockResolvedValue(customer());
        render(<UserDetails user={customer({ status: 'suspended' })} onUpdated={vi.fn()} />);

        await userEvent.click(screen.getByRole('button', { name: 'Reactivate account' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Reactivate' }));

        await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/admin/users/7/reactivate'));
    });

    it('warns that suspending a seller also hides their store', async () => {
        render(<UserDetails user={seller()} onUpdated={vi.fn()} />);

        expect(screen.getByText(/hides their store from customers/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Open seller profile' })).toHaveAttribute('href', '/admin/sellers/4');
        expect(screen.getByRole('link', { name: 'View orders' })).toHaveAttribute('href', '/admin/orders?seller=4');
    });

    it('links a customer to their own orders', () => {
        render(<UserDetails user={customer()} onUpdated={vi.fn()} />);

        expect(screen.getByRole('link', { name: 'View orders' })).toHaveAttribute('href', '/admin/orders?customer=7');
        expect(screen.getByText('$75.00')).toBeInTheDocument();
    });

    it('offers no suspend/reactivate for a self-deactivated account', () => {
        render(<UserDetails user={customer({ status: 'deactivated' })} onUpdated={vi.fn()} />);

        expect(screen.queryByRole('button', { name: /account$/ })).not.toBeInTheDocument();
        expect(screen.getByText(/deactivated their own account/)).toBeInTheDocument();
    });
});
