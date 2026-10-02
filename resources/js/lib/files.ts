/**
 * Client-side file checks shared by every upload control. These mirror the
 * backend FormRequest rules (mimes + max) so people get a plain-language
 * message before waiting on an upload that the server would reject anyway.
 */

export interface FileRule {
    /** Allowed MIME types, e.g. ['image/jpeg', 'image/png']. */
    types: string[];
    /** Human-readable list shown in hints/errors, e.g. 'JPG, PNG or WebP'. */
    typeLabel: string;
    maxBytes: number;
}

const MB = 1024 * 1024;

/** Product photos, logos, covers, category and ad images (max:20480). */
export const IMAGE_RULE: FileRule = {
    types: ['image/jpeg', 'image/png', 'image/webp'],
    typeLabel: 'JPG, PNG or WebP',
    maxBytes: 20 * MB,
};

/** Payment and payout slips (mimes:jpg,jpeg,png,webp,pdf|max:10240). */
export const SLIP_RULE: FileRule = {
    types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    typeLabel: 'photo (JPG, PNG, WebP) or PDF',
    maxBytes: 10 * MB,
};

/** Seller verification documents (mimes:pdf,jpg,jpeg,png|max:10240). */
export const DOCUMENT_RULE: FileRule = {
    types: ['application/pdf', 'image/jpeg', 'image/png'],
    typeLabel: 'PDF, JPG or PNG',
    maxBytes: 10 * MB,
};

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / MB).toFixed(1)} MB`;
}

/** Returns a friendly error message, or null when the file is acceptable. */
export function validateFile(file: File, rule: FileRule): string | null {
    if (!rule.types.includes(file.type)) {
        return `"${file.name}" isn't a supported file. Please choose a ${rule.typeLabel}.`;
    }
    if (file.size > rule.maxBytes) {
        return `"${file.name}" is too large (${formatBytes(file.size)}). Please choose one under ${formatBytes(rule.maxBytes)}.`;
    }
    return null;
}

export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}
