import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { router } from '@inertiajs/react';
import ProductDetail from '@/Pages/Customer/ProductDetail';
import { api } from '@/lib/api';
import type { Product } from '@/types/product';
import type { Seller } from '@/types/seller';
import type { SharedAuthUser } from '@/types/shared';

const page = vi.hoisted(() => ({ user: null as SharedAuthUser | null }));

vi.mock('@/Layouts/CustomerLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/shared/ProductGallery', () => ({
    default: () => <div />,
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

const seller = {
    id: 1,
    business_name: 'Cake Corner',
    slug: 'cake-corner',
    whatsapp_number: '+94 77 123 4567',
} as Seller;

const product: Product = {
    id: 7,
    name: 'Red Velvet',
    description: null,
    base_price: 20,
    average_rating: 0,
    preparation_time_hours: null,
    availability_status: 'in_stock',
    is_active: true,
    categories: [],
    variants: [],
    images: [],
};

function user(role: SharedAuthUser['role']): SharedAuthUser {
    return { id: 1, name: 'Sam', email: 'sam@example.com', avatar_url: null, role };
}

describe('Product detail add to cart', () => {
    beforeEach(() => {
        page.user = null;
        vi.mocked(api.post).mockReset().mockResolvedValue({});
        vi.mocked(router.visit).mockReset();
    });

    it('adds to the session cart for a guest, then opens the cart', async () => {
        render(<ProductDetail seller={seller} product={product} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

        await waitFor(() => expect(router.visit).toHaveBeenCalledWith('/cart'));
        expect(api.post).toHaveBeenCalledWith('/guest-cart', expect.objectContaining({ product_id: 7 }));
    });

    it('adds to the account cart for a customer', async () => {
        page.user = user('customer');
        render(<ProductDetail seller={seller} product={product} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/cart', expect.objectContaining({ product_id: 7 })));
    });

    it('disables ordering for a seller but keeps WhatsApp available', () => {
        page.user = user('seller');
        render(<ProductDetail seller={seller} product={product} />);

        expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
        expect(screen.getByText('Sign in with a customer account to order.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Order via WhatsApp' })).toHaveAttribute(
            'href',
            expect.stringContaining('https://wa.me/94771234567'),
        );
    });

    it('shows a full guest cart error from the server', async () => {
        vi.mocked(api.post).mockRejectedValue({ message: 'Your cart is full.', errors: { cart: ['Your cart can hold up to 20 items.'] } });
        render(<ProductDetail seller={seller} product={product} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Your cart can hold up to 20 items.');
    });
});
