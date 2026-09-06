import type { AdminBankAccount } from './adminBankAccount';

export type PaymentMethod = 'bank_transfer';
export type PaymentVerificationStatus = 'pending_verification' | 'verified' | 'rejected';

export interface Payment {
    id: number;
    payable_type: 'order' | 'subscription';
    payable_id: number;
    method: PaymentMethod;
    amount: number;
    admin_bank_account?: AdminBankAccount | null;
    status: PaymentVerificationStatus;
    rejection_reason: string | null;
    submitted_by?: {
        id: number;
        name: string;
    };
    verified_by?: {
        id: number;
        name: string;
    } | null;
    verified_at: string | null;
    created_at: string;
}
