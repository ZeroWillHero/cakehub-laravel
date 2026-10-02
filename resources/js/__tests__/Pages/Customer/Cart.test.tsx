import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { router } from '@inertiajs/react';
import Cart from '@/Pages/Customer/Cart';
import { api } from '@/lib/api';
import type { CartItem } from '@/types/cart';
import type { SharedAuthUser } from '@/types/shared';

const page = vi.hoisted(() => ({ user: null as SharedAuthUser | null }));

vi.mock('@/Layouts/CustomerLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
    router: { visit: vi.fn() },
    usePage: () => ({ props: { auth: { user: page.user } } }),
}));

vi.mock('@/lib/api', () => ({
    api: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

function item(overrides: Partial<CartItem> = {}): CartItem {
    return {
        id: 1,
        product_id: 7,
        product_name: 'Red Velvet',
        product_variant_id: null,
        variant_name: null,
        quantity: 1,
        unit_price: 20,
        line_total: 20,
        customization_notes: null,
        seller: { id: 1, business_name: 'Cake Corner', slug: 'cake-corner' },
        ...overrides,
    };
}

const customer: SharedAuthUser = { id: 1, name: 'Sam', email: 'sam@example.com', avatar_url: null, role: 'customer' };

describe('Cart page', () => {
    beforeEach(() => {
        page.user = null;
        vi.mocked(api.post).mockReset();
        vi.mocked(api.put).mockReset();
        vi.mocked(router.visit).mockReset();
    });

    it('asks a guest to sign in at checkout, with a full-page link through to checkout', async () => {
        render(<Cart items={[item()]} pendingMerge={null} />);

        await userEvent.click(screen.getByRole('button', { name: 'Proceed to checkout' }));

        expect(await screen.findByText('Sign in to check out')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /continue with google/i })).toHaveAttribute('href', '/checkout');
    });

    it('updates a guest cart line through the guest cart endpoint', async () => {
        vi.mocked(api.put).mockResolvedValue(item({ quantity: 2, line_total: 40 }));
        render(<Cart items={[item()]} pendingMerge={null} />);

        await userEvent.click(screen.getByRole('button', { name: 'Increase quantity of Red Velvet' }));

        await waitFor(() => expect(api.put).toHaveBeenCalledWith('/guest-cart/1', { quantity: 2 }));
    });

    it('links a customer straight to checkout', () => {
        page.user = customer;
        render(<Cart items={[item()]} pendingMerge={null} />);

        expect(screen.getByRole('link', { name: 'Proceed to checkout' })).toHaveAttribute('href', '/checkout');
    });

    it('asks which cart to keep after sign-in and continues to checkout with the choice', async () => {
        page.user = customer;
        vi.mocked(api.post).mockResolvedValue({ redirect_to: '/checkout' });
        const saved = item({ seller: { id: 1, business_name: 'Cake Corner', slug: 'cake-corner' } });
        const incoming = item({ id: 2, product_name: 'Lemon Tart', seller: { id: 2, business_name: 'Tart Town', slug: 'tart-town' } });

        render(<Cart items={[saved]} pendingMerge={{ saved: [saved], incoming: [incoming] }} />);

        expect(await screen.findByText('Which cart do you want to keep?')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /keep tart town/i }));

        await waitFor(() => expect(router.visit).toHaveBeenCalledWith('/checkout', { replace: true }));
        expect(api.post).toHaveBeenCalledWith('/cart/merge', { keep: 'incoming' });
    });
});
