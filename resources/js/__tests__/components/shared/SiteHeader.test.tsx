import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SiteHeader, { accountLinkFor, navLinksFor } from '@/components/shared/SiteHeader';
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

function user(role: SharedAuthUser['role']): SharedAuthUser {
    return { id: 1, name: 'Sam', email: 'sam@example.com', avatar_url: null, role };
}

const labels = (u: SharedAuthUser | null) => navLinksFor(u).map((link) => link.label);

describe('customer-facing navigation', () => {
    beforeEach(() => {
        page.user = null;
    });

    it('shows guests the browse links and their cart, but not orders or account', () => {
        expect(labels(null)).toEqual(['Home', 'Search', 'Cart']);
    });

    it('shows customers every link', () => {
        expect(labels(user('customer'))).toEqual(['Home', 'Search', 'Orders', 'Cart', 'Account']);
    });

    it('hides shopping links from sellers and admins browsing the public pages', () => {
        expect(labels(user('seller'))).toEqual(['Home', 'Search']);
        expect(labels(user('admin'))).toEqual(['Home', 'Search']);
    });

    it('points the avatar at the account page for customers and the dashboard for everyone else', () => {
        expect(accountLinkFor(user('customer')).href).toBe('/account');
        expect(accountLinkFor(user('seller')).href).toBe('/');
    });

    it('offers Google sign-in and no notification bell to guests', () => {
        render(<SiteHeader />);

        expect(screen.queryByTestId('notification-bell')).not.toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /continue with google/i })[0]).toHaveAttribute(
            'href',
            '/auth/google/redirect',
        );
    });

    it('shows the notification bell to signed-in users', () => {
        page.user = user('customer');
        render(<SiteHeader />);

        expect(screen.getAllByTestId('notification-bell').length).toBeGreaterThan(0);
    });
});
