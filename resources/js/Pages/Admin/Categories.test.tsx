import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminCategories from './Categories';
import { api } from '@/lib/api';
import type { Category } from '@/types/category';

vi.mock('@/lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        upload: vi.fn(),
    },
}));

function category(overrides: Partial<Category>): Category {
    return {
        id: 1,
        name: 'Birthday',
        slug: 'birthday',
        parent_id: null,
        sort_order: 0,
        is_active: true,
        ...overrides,
    };
}

describe('AdminCategories', () => {
    beforeEach(() => {
        vi.mocked(api.patch).mockResolvedValue({ reordered: true });
    });

    it('renders categories sorted by sort_order', () => {
        render(
            <AdminCategories
                categories={[
                    category({ id: 2, name: 'Wedding', sort_order: 1 }),
                    category({ id: 1, name: 'Birthday', sort_order: 0 }),
                ]}
            />,
        );

        const names = screen.getAllByText(/Birthday|Wedding/).map((el) => el.textContent);
        expect(names).toEqual(['Birthday', 'Wedding']);
    });

    it('disables "move up" for the first row and "move down" for the last row', () => {
        render(
            <AdminCategories
                categories={[category({ id: 1, sort_order: 0 }), category({ id: 2, name: 'Wedding', sort_order: 1 })]}
            />,
        );

        const upButtons = screen.getAllByRole('button', { name: 'Move up' });
        const downButtons = screen.getAllByRole('button', { name: 'Move down' });
        expect(upButtons[0]).toBeDisabled();
        expect(downButtons[downButtons.length - 1]).toBeDisabled();
    });

    it('swaps two categories and persists the new order when moved down', async () => {
        const user = userEvent.setup();
        render(
            <AdminCategories
                categories={[category({ id: 1, sort_order: 0 }), category({ id: 2, name: 'Wedding', sort_order: 1 })]}
            />,
        );

        await user.click(screen.getAllByRole('button', { name: 'Move down' })[0]);

        expect(api.patch).toHaveBeenCalledWith('/admin/categories/reorder', { order: [2, 1] });
        const names = screen.getAllByText(/Birthday|Wedding/).map((el) => el.textContent);
        expect(names).toEqual(['Wedding', 'Birthday']);
    });

    it('shows an empty state when there are no categories', () => {
        render(<AdminCategories categories={[]} />);
        expect(screen.getByText('No categories yet.')).toBeInTheDocument();
    });
});
