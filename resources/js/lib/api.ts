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

export interface UploadOptions {
    /** Called with 0–100 as the request body is sent. */
    onProgress?: (percent: number) => void;
}

function parseXhrResponse<T>(xhr: XMLHttpRequest): ApiSuccess<T> | ApiError {
    try {
        return JSON.parse(xhr.responseText) as ApiSuccess<T> | ApiError;
    } catch {
        if (xhr.status === 413) {
            return { message: 'That file is too large. Please choose a smaller one.' };
        }
        if (xhr.status === 0) {
            return { message: 'Upload interrupted. Please check your internet connection and try again.' };
        }
        return { message: `Something went wrong (${xhr.status}). Please try again.` };
    }
}

/**
 * Multipart upload. Uses XMLHttpRequest rather than fetch because fetch
 * can't report upload progress, and a visible percentage matters for large
 * photos on slow mobile connections.
 */
async function upload<T>(path: string, formData: FormData, options: UploadOptions = {}): Promise<T> {
    await primeCsrf();

    return new Promise<T>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api${path}`);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-XSRF-TOKEN', getCookie('XSRF-TOKEN') ?? '');

        if (options.onProgress) {
            const onProgress = options.onProgress;
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    onProgress(Math.round((event.loaded / event.total) * 100));
                }
            });
        }

        xhr.addEventListener('load', () => {
            const json = parseXhrResponse<T>(xhr);
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve((json as ApiSuccess<T>).data);
            } else {
                reject(json as ApiError);
            }
        });
        xhr.addEventListener('error', () => reject(parseXhrResponse<T>(xhr)));
        xhr.addEventListener('abort', () => reject({ message: 'Upload cancelled.' } satisfies ApiError));

        xhr.send(formData);
    });
}

export const api = {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
    upload: <T>(path: string, formData: FormData, options?: UploadOptions) => upload<T>(path, formData, options),
};
