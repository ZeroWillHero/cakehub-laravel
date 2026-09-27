import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminBankAccounts from '@/Pages/Admin/BankAccounts';
import { api } from '@/lib/api';
import type { AdminBankAccount } from '@/types/adminBankAccount';

vi.mock('@/Layouts/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
    api: {
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
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
        is_active: false,
        sort_order: 2,
    },
];

describe('Admin BankAccounts page', () => {
    beforeEach(() => {
        vi.mocked(api.post).mockReset();
        vi.mocked(api.patch).mockReset();
        vi.mocked(api.delete).mockReset();
    });

    it('renders the list of accounts passed as a prop', () => {
        render(<AdminBankAccounts accounts={accounts} />);

        expect(screen.getByText('Bank of Ceylon')).toBeInTheDocument();
        expect(screen.getByText('Commercial Bank')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('shows an empty state when there are no accounts', () => {
        render(<AdminBankAccounts accounts={[]} />);
        expect(screen.getByText('No bank accounts yet.')).toBeInTheDocument();
    });

    it('opens the add-account dialog and keeps submit disabled until required fields are filled', async () => {
        render(<AdminBankAccounts accounts={[]} />);

        await userEvent.click(screen.getByRole('button', { name: /add bank account/i }));

        const dialogAddButton = screen.getByRole('button', { name: 'Add' });
        expect(dialogAddButton).toBeDisabled();

        await userEvent.type(screen.getByLabelText(/bank name/i), 'Sampath Bank');
        expect(dialogAddButton).toBeDisabled();

        await userEvent.type(screen.getByLabelText(/account name/i), 'CakeHub Pvt Ltd');
        expect(dialogAddButton).toBeDisabled();

        await userEvent.type(screen.getByLabelText(/account number/i), '5555555');
        expect(dialogAddButton).toBeEnabled();
    });

    it('submits the new account via the API and adds it to the list', async () => {
        const created: AdminBankAccount = {
            id: 3,
            bank_name: 'Sampath Bank',
            account_name: 'CakeHub Pvt Ltd',
            account_number: '5555555',
            branch: null,
            is_active: true,
            sort_order: 3,
        };
        vi.mocked(api.post).mockResolvedValue(created);

        render(<AdminBankAccounts accounts={[]} />);
        await userEvent.click(screen.getByRole('button', { name: /add bank account/i }));

        await userEvent.type(screen.getByLabelText(/bank name/i), 'Sampath Bank');
        await userEvent.type(screen.getByLabelText(/account name/i), 'CakeHub Pvt Ltd');
        await userEvent.type(screen.getByLabelText(/account number/i), '5555555');

        await userEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() =>
            expect(api.post).toHaveBeenCalledWith('/admin/bank-accounts', {
                bank_name: 'Sampath Bank',
                account_name: 'CakeHub Pvt Ltd',
                account_number: '5555555',
                branch: '',
            }),
        );
        expect(await screen.findByText('Sampath Bank')).toBeInTheDocument();
    });

    it('requires explicit confirmation before deleting an account', async () => {
        render(<AdminBankAccounts accounts={accounts} />);

        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        await userEvent.click(deleteButtons[0]);

        expect(await screen.findByText('Delete "Bank of Ceylon"?')).toBeInTheDocument();
        expect(api.delete).not.toHaveBeenCalled();

        // Cancelling must not delete.
        await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(api.delete).not.toHaveBeenCalled();
        expect(screen.queryByText('Delete "Bank of Ceylon"?')).not.toBeInTheDocument();

        // Re-open and confirm.
        await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/admin/bank-accounts/1'));
    });
});
