import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FloatingNav from '@/components/shared/FloatingNav';
import type { SharedAuthUser } from '@/types/shared';

const page = vi.hoisted(() => ({ user: null as SharedAuthUser | null }));

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
    usePage: () => ({ props: { auth: { user: page.user } }, url: '/' }),
}));

vi.mock('@/components/shared/NotificationBell', () => ({
    default: () => <div data-testid="notification-bell" />,
}));

describe('FloatingNav', () => {
    beforeEach(() => {
        page.user = null;
    });

    it('gives guests a full-page Google sign-in link instead of an account link', () => {
        render(<FloatingNav visible />);

        expect(screen.getByRole('link', { name: 'Sign in with Google' })).toHaveAttribute('href', '/auth/google/redirect');
        expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument();
        expect(screen.queryByTestId('notification-bell')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Cart' })).toHaveAttribute('href', '/cart');
        expect(screen.queryByRole('link', { name: 'Orders' })).not.toBeInTheDocument();
    });

    it('sends a seller\'s avatar to their dashboard and hides shopping links', () => {
        page.user = { id: 1, name: 'Sam', email: 'sam@example.com', avatar_url: null, role: 'seller' };
        render(<FloatingNav visible />);

        expect(screen.getByRole('link', { name: 'Your dashboard' })).toHaveAttribute('href', '/');
        expect(screen.queryByRole('link', { name: 'Cart' })).not.toBeInTheDocument();
    });
});
