import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import SellerPayouts from '@/Pages/Seller/Payouts';
import { api } from '@/lib/api';
import type { SellerPayout } from '@/types/sellerPayout';

vi.mock('@/Layouts/SellerLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
    api: {
        post: vi.fn(),
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
        order: { id: 500, total: 30 },
        created_at: '2026-09-01T00:00:00Z',
        ...overrides,
    };
}

describe('Seller Payouts page', () => {
    beforeEach(() => {
        vi.mocked(api.post).mockReset();
    });

    it('renders the correct status badge label per status', () => {
        const payouts = [
            payout({ id: 1, status: 'pending' }),
            payout({ id: 2, status: 'paid' }),
            payout({ id: 3, status: 'confirmed' }),
        ];
        render(<SellerPayouts payouts={payouts} />);

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Paid — awaiting your confirmation')).toBeInTheDocument();
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });

    it('only shows "Confirm received" for payouts marked paid, not pending or already confirmed', () => {
        const payouts = [
            payout({ id: 1, status: 'pending' }),
            payout({ id: 2, status: 'paid' }),
            payout({ id: 3, status: 'confirmed' }),
        ];
        render(<SellerPayouts payouts={payouts} />);

        const confirmButtons = screen.getAllByRole('button', { name: /confirm received/i });
        expect(confirmButtons).toHaveLength(1);
    });

    it('a seller cannot confirm a still-pending payout (no button rendered for it)', () => {
        const payouts = [payout({ id: 1, status: 'pending' })];
        render(<SellerPayouts payouts={payouts} />);

        expect(screen.queryByRole('button', { name: /confirm received/i })).not.toBeInTheDocument();
    });

    it('confirms a paid payout via the API and updates its status', async () => {
        const payouts = [payout({ id: 1, status: 'paid' })];
        vi.mocked(api.post).mockResolvedValue(payout({ id: 1, status: 'confirmed' }));

        render(<SellerPayouts payouts={payouts} />);

        await userEvent.click(screen.getByRole('button', { name: /confirm received/i }));

        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/seller/payouts/1/confirm'));
        expect(await screen.findByText('Confirmed')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /confirm received/i })).not.toBeInTheDocument();
    });

    it('opens a modal with the slip image when "View payment slip" is clicked', async () => {
        const payouts = [payout({ id: 1, status: 'paid', has_slip: true })];
        render(<SellerPayouts payouts={payouts} />);

        await userEvent.click(screen.getByRole('button', { name: /view payment slip/i }));

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /payout slip/i })).toHaveAttribute(
            'src',
            '/api/seller/payouts/1',
        );
    });
});
