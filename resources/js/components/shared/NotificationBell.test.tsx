import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationBell from './NotificationBell';

function mockNotificationsResponse(data: unknown[], unreadCount: number) {
    return {
        ok: true,
        json: async () => ({ data, meta: { unread_count: unreadCount } }),
    } as Response;
}

describe('NotificationBell', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('shows no unread badge when there are no notifications', async () => {
        vi.mocked(fetch).mockResolvedValue(mockNotificationsResponse([], 0));

        render(<NotificationBell />);

        await waitFor(() => expect(fetch).toHaveBeenCalled());
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('shows the unread count badge', async () => {
        vi.mocked(fetch).mockResolvedValue(
            mockNotificationsResponse(
                [{ id: '1', data: { message: 'Order #1 is now confirmed.' }, read_at: null, created_at: new Date().toISOString() }],
                1,
            ),
        );

        render(<NotificationBell />);

        expect(await screen.findByText('1')).toBeInTheDocument();
    });

    it('opens the dropdown and lists notification messages on click', async () => {
        vi.mocked(fetch).mockResolvedValue(
            mockNotificationsResponse(
                [{ id: '1', data: { message: 'Order #1 is now confirmed.' }, read_at: null, created_at: new Date().toISOString() }],
                1,
            ),
        );
        const user = userEvent.setup();

        render(<NotificationBell />);
        await screen.findByText('1');
        await user.click(screen.getByRole('button', { name: 'Notifications' }));

        expect(await screen.findByText('Order #1 is now confirmed.')).toBeInTheDocument();
    });

    it('shows an empty state when there are no notifications', async () => {
        vi.mocked(fetch).mockResolvedValue(mockNotificationsResponse([], 0));
        const user = userEvent.setup();

        render(<NotificationBell />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await user.click(screen.getByRole('button', { name: 'Notifications' }));

        expect(await screen.findByText('No notifications yet.')).toBeInTheDocument();
    });
});
