import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminSellerPayouts from '@/Pages/Admin/SellerPayouts';
import { api } from '@/lib/api';
import type { SellerPayout } from '@/types/sellerPayout';

vi.mock('@/Layouts/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
    api: {
        upload: vi.fn(),
    },
}));

function payout(overrides: Partial<SellerPayout>): SellerPayout {
    return {
        id: 1,
        order_id: 500,
        amount: 30,
        status: 'pending',
        has_slip: false,
        paid_at: null,
        confirmed_at: null,
        seller: { id: 1, business_name: 'Sweet Treats' },
        order: { id: 500, total: 30 },
        created_at: '2026-09-01T00:00:00Z',
        ...overrides,
    };
}

describe('Admin SellerPayouts page', () => {
    beforeEach(() => {
        vi.mocked(api.upload).mockReset();
    });

    it('renders the correct status badge label per status', () => {
        const payouts = [
            payout({ id: 1, status: 'pending' }),
            payout({ id: 2, status: 'paid' }),
            payout({ id: 3, status: 'confirmed' }),
        ];
        render(<AdminSellerPayouts payouts={payouts} />);

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Paid')).toBeInTheDocument();
        expect(screen.getByText('Confirmed by seller')).toBeInTheDocument();
    });

    it('only shows "Mark paid" for pending payouts', () => {
        const payouts = [
            payout({ id: 1, status: 'pending' }),
            payout({ id: 2, status: 'paid' }),
            payout({ id: 3, status: 'confirmed' }),
        ];
        render(<AdminSellerPayouts payouts={payouts} />);

        expect(screen.getAllByRole('button', { name: /mark paid/i })).toHaveLength(1);
    });

    it('shows an empty state when there are no payouts', () => {
        render(<AdminSellerPayouts payouts={[]} />);
        expect(screen.getByText('No payouts yet.')).toBeInTheDocument();
    });

    it('requires a slip file before "Mark paid" can be confirmed in the dialog', async () => {
        const payouts = [payout({ id: 1, status: 'pending' })];
        render(<AdminSellerPayouts payouts={payouts} />);

        await userEvent.click(screen.getByRole('button', { name: /mark paid/i }));

        const confirmButton = await screen.findByRole('button', { name: 'Mark paid' });
        expect(confirmButton).toBeDisabled();

        const file = new File(['slip'], 'slip.png', { type: 'image/png' });
        await userEvent.upload(screen.getByLabelText(/payment slip/i), file);

        expect(confirmButton).toBeEnabled();

        vi.mocked(api.upload).mockResolvedValue(payout({ id: 1, status: 'paid', has_slip: true }));
        await userEvent.click(confirmButton);

        await waitFor(() =>
            expect(api.upload).toHaveBeenCalledWith(
                '/admin/seller-payouts/1/mark-paid',
                expect.any(FormData),
            ),
        );
        expect(await screen.findByText('Paid')).toBeInTheDocument();
    });

    it('opens a modal with the slip image when "View slip" is clicked', async () => {
        const payouts = [payout({ id: 1, status: 'paid', has_slip: true })];
        render(<AdminSellerPayouts payouts={payouts} />);

        await userEvent.click(screen.getByRole('button', { name: /view slip/i }));

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /payout slip/i })).toHaveAttribute(
            'src',
            '/api/seller/payouts/1',
        );
    });
});
