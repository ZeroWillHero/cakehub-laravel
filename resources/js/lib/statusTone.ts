/**
 * Traffic-light badge colors for every status in the app, per
 * docs/skills/frontend-design-skill.md ("Status badge color convention"):
 * yellow = waiting, green = good/final, red = negative/terminal. Always
 * render the status text alongside — color is never the only signal.
 */
const tones = {
    yellow: 'border-transparent bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200',
    green: 'border-transparent bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-200',
    red: 'border-transparent bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200',
} as const;

const statusToTone: Record<string, keyof typeof tones> = {
    pending: 'yellow',
    pending_verification: 'yellow',
    awaiting_verification: 'yellow',
    grace_period: 'yellow',
    cancelling: 'yellow',
    verified: 'green',
    approved: 'green',
    paid: 'green',
    active: 'green',
    confirmed: 'green',
    completed: 'green',
    rejected: 'red',
    cancelled: 'red',
    expired: 'red',
    suspended: 'red',
};

/** Tailwind classes for a `<Badge>` showing `status`; empty string if unknown. */
export function statusTone(status: string): string {
    const tone = statusToTone[status];
    return tone ? tones[tone] : '';
}
