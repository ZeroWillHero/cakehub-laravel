import type { ApiError } from '@/lib/api';

/**
 * Pulls the most useful human-readable message out of a rejected `api` call —
 * the named field's validation error first, then any field error, then the
 * top-level message. Kept out of lib/api.ts so tests that mock that module
 * still get the real helper.
 */
export function errorMessage(err: unknown, field?: string, fallback = 'Something went wrong. Please try again.'): string {
    const apiError = err as Partial<ApiError> | undefined;
    if (field && apiError?.errors?.[field]?.[0]) return apiError.errors[field][0];
    const firstFieldError = apiError?.errors ? Object.values(apiError.errors)[0]?.[0] : undefined;
    return firstFieldError ?? apiError?.message ?? fallback;
}
