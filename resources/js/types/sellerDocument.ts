export type DocumentType = 'business_registration' | 'food_safety_cert' | 'address_proof';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface SellerDocument {
    id: number;
    type: DocumentType;
    status: DocumentStatus;
    rejection_reason: string | null;
    reviewed_at: string | null;
    created_at: string;
}
