export interface AdminBankAccount {
    id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    branch: string | null;
    is_active: boolean;
    sort_order: number;
}
