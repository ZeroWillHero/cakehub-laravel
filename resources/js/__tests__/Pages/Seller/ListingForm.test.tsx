import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { router } from '@inertiajs/react';
import ListingForm from '@/Pages/Seller/ListingForm';
import { api } from '@/lib/api';
import type { Product } from '@/types/product';

vi.mock('@/Layouts/SellerLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
    router: { visit: vi.fn() },
}));

vi.mock('@/lib/api', () => ({
    api: {
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        upload: vi.fn(),
    },
}));

function product(overrides: Partial<Product> = {}): Product {
    return {
        id: 7,
        name: 'Red velvet',
        description: null,
        base_price: 25,
        average_rating: 0,
        preparation_time_hours: null,
        availability_status: 'in_stock',
        is_active: true,
        categories: [],
        variants: [],
        images: [],
        ...overrides,
    };
}

const photo = () => new File(['img'], 'cake.png', { type: 'image/png' });

describe('Seller ListingForm photos', () => {
    beforeEach(() => {
        vi.mocked(api.post).mockReset();
        vi.mocked(api.upload).mockReset();
        vi.mocked(router.visit).mockReset();
    });

    it('lets a new product pick photos up front and uploads them after it is created', async () => {
        vi.mocked(api.post).mockResolvedValue(product());
        vi.mocked(api.upload).mockResolvedValue({ id: 1, url: '/p/1.png', sort_order: 0 });

        render(<ListingForm categories={[]} usage={0} limit={null} product={null} />);

        await userEvent.upload(screen.getByLabelText(/add product photos/i), photo());
        expect(screen.getByText(/main photo · uploads when you save/i)).toBeInTheDocument();

        await userEvent.type(screen.getByLabelText(/product name/i), 'Red velvet');
        await userEvent.type(screen.getByLabelText(/price/i), '25');
        await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

        await waitFor(() => expect(api.upload).toHaveBeenCalledTimes(1));
        expect(vi.mocked(api.upload).mock.calls[0][0]).toBe('/seller/products/7/images');
        await waitFor(() => expect(router.visit).toHaveBeenCalledWith('/seller/listings'));
    });

    it('sends the seller to the edit page if a photo fails after the product is saved', async () => {
        vi.mocked(api.post).mockResolvedValue(product());
        vi.mocked(api.upload).mockRejectedValue({ message: 'Upload failed' });

        render(<ListingForm categories={[]} usage={0} limit={null} product={null} />);

        await userEvent.upload(screen.getByLabelText(/add product photos/i), photo());
        await userEvent.type(screen.getByLabelText(/product name/i), 'Red velvet');
        await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

        await waitFor(() =>
            expect(router.visit).toHaveBeenCalledWith('/seller/listings/7/edit?photos_failed=1'),
        );
    });

    it('uploads straight away when editing and shows the saved photo', async () => {
        vi.mocked(api.upload).mockResolvedValue({ id: 9, url: '/p/9.png', sort_order: 0 });

        render(<ListingForm categories={[]} usage={1} limit={null} product={product()} />);

        await userEvent.upload(screen.getByLabelText(/add product photos/i), photo());

        await waitFor(() => expect(api.upload).toHaveBeenCalledTimes(1));
        expect(await screen.findByRole('img', { name: 'Photo 1' })).toHaveAttribute('src', '/p/9.png');
        expect(screen.getByText('Main photo')).toBeInTheDocument();
    });
});
