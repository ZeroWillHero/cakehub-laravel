export interface ApiSuccess<T> {
    data: T;
    meta?: Record<string, unknown>;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

let csrfPrimed = false;

async function primeCsrf(): Promise<void> {
    if (csrfPrimed) return;
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
    csrfPrimed = true;
}

/**
 * The server is expected to always respond with JSON, but a fatal PHP error
 * (e.g. exceeding the upload size limit) can print an HTML warning instead,
 * which breaks `response.json()` with a cryptic "Unexpected token '<'"
 * SyntaxError. Fall back to a readable message keyed off the HTTP status
 * instead of letting that parse error leak up to the UI unhandled.
 */
async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T> | ApiError> {
    try {
        return (await response.json()) as ApiSuccess<T> | ApiError;
    } catch {
        if (response.status === 413) {
            return { message: 'That file is too large. Please choose a smaller one.' };
        }
        return { message: `Something went wrong (${response.status}). Please try again.` };
    }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (method !== 'GET') {
        await primeCsrf();
    }

    const response = await fetch(`/api${path}`, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const json = await parseJsonResponse<T>(response);

    if (!response.ok) {
        throw json as ApiError;
    }

    return (json as ApiSuccess<T>).data;
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
    await primeCsrf();

    const response = await fetch(`/api${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
        },
        body: formData,
    });

    const json = await parseJsonResponse<T>(response);

    if (!response.ok) {
        throw json as ApiError;
    }

    return (json as ApiSuccess<T>).data;
}

export const api = {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
    upload: <T>(path: string, formData: FormData) => upload<T>(path, formData),
};
