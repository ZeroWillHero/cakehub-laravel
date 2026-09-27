import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PaymentSlipForm from '@/components/shared/PaymentSlipForm';
import { api } from '@/lib/api';
import type { AdminBankAccount } from '@/types/adminBankAccount';
import type { Payment } from '@/types/payment';

vi.mock('@/lib/api', () => ({
    api: {
        get: vi.fn(),
        upload: vi.fn(),
    },
}));

const accounts: AdminBankAccount[] = [
    {
        id: 1,
        bank_name: 'Bank of Ceylon',
        account_name: 'CakeHub Pvt Ltd',
        account_number: '123456789',
        branch: 'Colombo',
        is_active: true,
        sort_order: 1,
    },
    {
        id: 2,
        bank_name: 'Commercial Bank',
        account_name: 'CakeHub Pvt Ltd',
        account_number: '987654321',
        branch: null,
        is_active: true,
        sort_order: 2,
    },
];

function makeFile(name = 'slip.png', type = 'image/png') {
    return new File(['slip-content'], name, { type });
}

describe('PaymentSlipForm', () => {
    beforeEach(() => {
        vi.mocked(api.get).mockReset();
        vi.mocked(api.upload).mockReset();
        vi.mocked(api.get).mockResolvedValue(accounts);
    });

    it('renders the bank-account selector, file input, and amount', async () => {
        render(
            <PaymentSlipForm payableType="order" payableId={42} amount={19.99} onSubmitted={vi.fn()} />,
        );

        expect(await screen.findByText('Bank of Ceylon')).toBeInTheDocument();
        expect(screen.getByText('Commercial Bank')).toBeInTheDocument();
        expect(screen.getByText('$19.99', { exact: false })).toBeInTheDocument();
        expect(screen.getByLabelText(/payment slip/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/bank reference/i)).toBeInTheDocument();
    });

    it('disables submit until an account and file are chosen', async () => {
        render(
            <PaymentSlipForm payableType="order" payableId={42} amount={19.99} onSubmitted={vi.fn()} />,
        );

        await screen.findByText('Bank of Ceylon');
        const submitButton = screen.getByRole('button', { name: /submit payment slip/i });

        // An account is auto-selected (first one returned), but no file yet.
        expect(submitButton).toBeDisabled();

        const fileInput = screen.getByLabelText(/payment slip/i) as HTMLInputElement;
        await userEvent.upload(fileInput, makeFile());

        expect(submitButton).toBeEnabled();
    });

    it('shows field-specific validation errors returned by the API', async () => {
        vi.mocked(api.upload).mockRejectedValue({
            message: 'Validation failed',
            errors: { slip: ['The slip must be an image or PDF.'] },
        });

        render(
            <PaymentSlipForm payableType="order" payableId={42} amount={19.99} onSubmitted={vi.fn()} />,
        );

        await screen.findByText('Bank of Ceylon');
        const fileInput = screen.getByLabelText(/payment slip/i) as HTMLInputElement;
        await userEvent.upload(fileInput, makeFile());

        const submitButton = screen.getByRole('button', { name: /submit payment slip/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('The slip must be an image or PDF.')).toBeInTheDocument();
    });

    it('submits the expected payload and calls onSubmitted on success', async () => {
        const onSubmitted = vi.fn();
        const returnedPayment = { id: 7 } as Payment;
        vi.mocked(api.upload).mockResolvedValue(returnedPayment);

        render(
            <PaymentSlipForm payableType="subscription" payableId={9} amount={49.5} onSubmitted={onSubmitted} />,
        );

        await screen.findByText('Bank of Ceylon');

        // Switch to the second account and add a reference.
        const secondAccountRadio = screen.getByRole('radio', { name: /commercial bank/i });
        await userEvent.click(secondAccountRadio);
        await userEvent.type(screen.getByLabelText(/bank reference/i), 'REF-001');

        const file = makeFile();
        await userEvent.upload(screen.getByLabelText(/payment slip/i), file);

        await userEvent.click(screen.getByRole('button', { name: /submit payment slip/i }));

        await waitFor(() => expect(api.upload).toHaveBeenCalledTimes(1));
        const [path, formData] = vi.mocked(api.upload).mock.calls[0] as [string, FormData];
        expect(path).toBe('/payments');
        expect(formData.get('payable_type')).toBe('subscription');
        expect(formData.get('payable_id')).toBe('9');
        expect(formData.get('amount')).toBe('49.5');
        expect(formData.get('admin_bank_account_id')).toBe('2');
        expect(formData.get('reference')).toBe('REF-001');
        expect(formData.get('slip')).toBe(file);

        await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(returnedPayment));
    });

    it('shows a disabled/loading state while submitting', async () => {
        let resolveUpload: (value: Payment) => void = () => {};
        vi.mocked(api.upload).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveUpload = resolve;
                }),
        );

        render(
            <PaymentSlipForm payableType="order" payableId={42} amount={19.99} onSubmitted={vi.fn()} />,
        );

        await screen.findByText('Bank of Ceylon');
        await userEvent.upload(screen.getByLabelText(/payment slip/i), makeFile());

        const submitButton = screen.getByRole('button', { name: /submit payment slip/i });
        await userEvent.click(submitButton);

        expect(await screen.findByRole('button', { name: /submitting/i })).toBeDisabled();

        resolveUpload({ id: 1 } as Payment);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /submit payment slip/i })).toBeEnabled(),
        );
    });
});
