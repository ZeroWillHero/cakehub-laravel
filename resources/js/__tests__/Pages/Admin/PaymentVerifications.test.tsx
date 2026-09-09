import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminPaymentVerifications from '@/Pages/Admin/PaymentVerifications';
import { api } from '@/lib/api';
import type { Payment } from '@/types/payment';

vi.mock('@/Layouts/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
    api: {
        post: vi.fn(),
    },
}));

const payments: Payment[] = [
    {
        id: 1,
        payable_type: 'order',
        payable_id: 100,
        method: 'bank_transfer',
        amount: 25,
        admin_bank_account: {
            id: 1,
            bank_name: 'Bank of Ceylon',
            account_name: 'CakeHub',
            account_number: '123',
            branch: null,
            is_active: true,
            sort_order: 1,
        },
        status: 'pending_verification',
        rejection_reason: null,
        submitted_by: { id: 5, name: 'Jane Customer' },
        verified_by: null,
        verified_at: null,
        created_at: '2026-09-01T00:00:00Z',
    },
    {
        id: 2,
        payable_type: 'subscription',
        payable_id: 200,
        method: 'bank_transfer',
        amount: 50,
        admin_bank_account: {
            id: 2,
            bank_name: 'Commercial Bank',
            account_name: 'CakeHub',
            account_number: '456',
            branch: null,
            is_active: true,
            sort_order: 2,
        },
        status: 'pending_verification',
        rejection_reason: null,
        submitted_by: { id: 6, name: 'Sam Seller' },
        verified_by: null,
        verified_at: null,
        created_at: '2026-09-02T00:00:00Z',
    },
];

describe('Admin PaymentVerifications page', () => {
    beforeEach(() => {
        vi.mocked(api.post).mockReset();
    });

    it('renders pending payments with a "View slip" button per row', () => {
        render(<AdminPaymentVerifications payments={payments} />);

        expect(screen.getByText(/order #100/i)).toBeInTheDocument();
        expect(screen.getByText(/subscription #200/i)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /view slip/i })).toHaveLength(2);
    });

    it('shows an empty state when there is nothing to verify', () => {
        render(<AdminPaymentVerifications payments={[]} />);
        expect(screen.getByText('No payments awaiting verification.')).toBeInTheDocument();
    });

    it('opens the slip in a modal instead of a new tab, with Approve/Decline actions', async () => {
        render(<AdminPaymentVerifications payments={payments} />);

        await userEvent.click(screen.getAllByRole('button', { name: /view slip/i })[0]);

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /payment slip/i })).toHaveAttribute('src', '/api/payments/1');
        expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^decline$/i })).toBeInTheDocument();
    });

    it('approves a payment from the modal and removes it from the list', async () => {
        vi.mocked(api.post).mockResolvedValue(undefined);
        render(<AdminPaymentVerifications payments={payments} />);

        await userEvent.click(screen.getAllByRole('button', { name: /view slip/i })[0]);
        await userEvent.click(await screen.findByRole('button', { name: /^approve$/i }));

        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/payments/1/verify'));
        await waitFor(() => expect(screen.queryByText(/order #100/i)).not.toBeInTheDocument());
        expect(screen.getByText(/subscription #200/i)).toBeInTheDocument();
    });

    it('requires a reason before confirming a decline, then rejects the payment', async () => {
        vi.mocked(api.post).mockResolvedValue(undefined);
        render(<AdminPaymentVerifications payments={payments} />);

        await userEvent.click(screen.getAllByRole('button', { name: /view slip/i })[0]);
        await userEvent.click(await screen.findByRole('button', { name: /^decline$/i }));

        const confirmButton = await screen.findByRole('button', { name: /confirm decline/i });
        expect(confirmButton).toBeDisabled();

        await userEvent.type(screen.getByLabelText(/reason for declining/i), 'Slip amount does not match.');
        expect(confirmButton).toBeEnabled();

        await userEvent.click(confirmButton);

        await waitFor(() =>
            expect(api.post).toHaveBeenCalledWith('/admin/payments/1/reject', {
                rejection_reason: 'Slip amount does not match.',
            }),
        );
        await waitFor(() => expect(screen.queryByText(/order #100/i)).not.toBeInTheDocument());
    });
});
