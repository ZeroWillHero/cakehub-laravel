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

    const json = (await response.json()) as ApiSuccess<T> | ApiError;

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

    const json = (await response.json()) as ApiSuccess<T> | ApiError;

    if (!response.ok) {
        throw json as ApiError;
    }

    return (json as ApiSuccess<T>).data;
}

export const api = {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
    upload: <T>(path: string, formData: FormData) => upload<T>(path, formData),
};
