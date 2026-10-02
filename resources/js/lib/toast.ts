/**
 * Minimal app-wide notifications ("Saved", "Couldn't delete…") so no action
 * finishes silently. Rendered by components/shared/Toaster.tsx, which is
 * mounted once in app.tsx. Calling toast.* with no Toaster mounted (e.g. in
 * unit tests) is a harmless no-op.
 */
export type ToastTone = 'success' | 'error';

export interface ToastItem {
    id: number;
    tone: ToastTone;
    message: string;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((listener) => listener());
}

export function dismissToast(id: number) {
    items = items.filter((item) => item.id !== id);
    emit();
}

function push(tone: ToastTone, message: string) {
    const id = nextId++;
    items = [...items.slice(-2), { id, tone, message }];
    emit();
    window.setTimeout(() => dismissToast(id), tone === 'error' ? 7000 : 4000);
}

export const toast = {
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
};

export function subscribeToasts(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getToasts() {
    return items;
}
