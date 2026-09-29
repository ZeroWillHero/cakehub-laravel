import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AdminAds from '@/Pages/Admin/Ads';
import { api } from '@/lib/api';
import type { Ad } from '@/types/ad';

vi.mock('@/Layouts/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
    api: {
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        upload: vi.fn(),
    },
}));

function ad(overrides: Partial<Ad>): Ad {
    return {
        id: 1,
        name: 'Birthday Bash',
        description: 'Get 10% off',
        image_path: null,
        image_url: null,
        link_url: null,
        paid_amount: 100,
        status: 'active',
        starts_at: '2026-09-01',
        ends_at: '2026-09-30',
        sort_order: 0,
        created_by: 1,
        is_currently_visible: true,
        ...overrides,
    };
}

const setting = { rotation_seconds: 5 };

describe('Admin Ads page', () => {
    beforeEach(() => {
        vi.mocked(api.post).mockReset();
        vi.mocked(api.put).mockReset();
        vi.mocked(api.patch).mockReset();
        vi.mocked(api.delete).mockReset();
        vi.mocked(api.upload).mockReset();
    });

    it('renders ads with name, status badge, and formatted price/date range', () => {
        const ads = [
            ad({ id: 1, name: 'Birthday Bash', is_currently_visible: true, status: 'active' }),
            ad({ id: 2, name: 'Wedding Special', is_currently_visible: false, status: 'draft' }),
        ];
        render(<AdminAds ads={ads} setting={setting} />);

        expect(screen.getByText('Birthday Bash')).toBeInTheDocument();
        expect(screen.getByText('Wedding Special')).toBeInTheDocument();
        expect(screen.getByText('Live')).toBeInTheDocument();
        expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
        expect(
            screen.getAllByText((_, element) => element?.textContent === '$100.00 · 2026-09-01 → 2026-09-30')
                .length,
        ).toBeGreaterThan(0);
    });

    it('shows an empty state when there are no ads', () => {
        render(<AdminAds ads={[]} setting={setting} />);
        expect(screen.getByText('No ads yet.')).toBeInTheDocument();
    });

    it('renders drag handles with the correct accessible name for each ad', () => {
        const ads = [ad({ id: 1, name: 'Birthday Bash' }), ad({ id: 2, name: 'Wedding Special' })];
        render(<AdminAds ads={ads} setting={setting} />);

        expect(screen.getByRole('button', { name: 'Drag to reorder Birthday Bash' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Drag to reorder Wedding Special' })).toBeInTheDocument();
    });

    it('disables the Add button in the create dialog until all required fields are filled, then submits', async () => {
        vi.mocked(api.post).mockResolvedValue(ad({ id: 3, name: 'New Ad' }));
        render(<AdminAds ads={[]} setting={setting} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add ad' }));

        const addButton = screen.getByRole('button', { name: 'Add' });
        expect(addButton).toBeDisabled();

        await userEvent.type(screen.getByLabelText('Name'), 'New Ad');
        expect(addButton).toBeDisabled();

        await userEvent.type(screen.getByLabelText('Paid amount'), '50');
        expect(addButton).toBeDisabled();

        const inputs = screen.getAllByLabelText(/date/i);
        const startInput = screen.getByLabelText('Start date');
        const endInput = screen.getByLabelText('End date');
        await userEvent.type(startInput, '2026-10-01');
        expect(addButton).toBeDisabled();
        await userEvent.type(endInput, '2026-10-31');

        expect(addButton).toBeEnabled();

        await userEvent.click(addButton);

        await waitFor(() =>
            expect(api.post).toHaveBeenCalledWith('/admin/ads', {
                name: 'New Ad',
                description: null,
                link_url: null,
                paid_amount: 50,
                starts_at: '2026-10-01',
                ends_at: '2026-10-31',
            }),
        );
        expect(inputs.length).toBeGreaterThan(0);
    });

    it('uploads an image via the row image input', async () => {
        const ads = [ad({ id: 1, name: 'Birthday Bash', image_path: null })];
        vi.mocked(api.upload).mockResolvedValue(ad({ id: 1, name: 'Birthday Bash', image_path: 'ads/1.png' }));
        render(<AdminAds ads={ads} setting={setting} />);

        const fileInput = screen.getByLabelText('Upload image for Birthday Bash') as HTMLInputElement;
        const file = new File(['img'], 'ad.png', { type: 'image/png' });
        await userEvent.upload(fileInput, file);

        await waitFor(() =>
            expect(api.upload).toHaveBeenCalledWith('/admin/ads/1/image', expect.any(FormData)),
        );
    });

    it('changes status via the Select, calling api.put', async () => {
        const ads = [ad({ id: 1, name: 'Birthday Bash', status: 'draft' })];
        vi.mocked(api.put).mockResolvedValue(ad({ id: 1, name: 'Birthday Bash', status: 'paused' }));
        render(<AdminAds ads={ads} setting={setting} />);

        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click(await screen.findByRole('option', { name: 'Paused' }));

        await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/ads/1', { status: 'paused' }));
    });

    it('requires AlertDialog confirmation before deleting an ad', async () => {
        const ads = [ad({ id: 1, name: 'Birthday Bash' })];
        vi.mocked(api.delete).mockResolvedValue(undefined);
        render(<AdminAds ads={ads} setting={setting} />);

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(await screen.findByText('Delete "Birthday Bash"?')).toBeInTheDocument();
        expect(api.delete).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/admin/ads/1'));
        await waitFor(() => expect(screen.queryByText('Birthday Bash')).not.toBeInTheDocument());
    });

    it('cancelling the delete AlertDialog does not call the API', async () => {
        const ads = [ad({ id: 1, name: 'Birthday Bash' })];
        render(<AdminAds ads={ads} setting={setting} />);

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        expect(api.delete).not.toHaveBeenCalled();
        expect(screen.getByText('Birthday Bash')).toBeInTheDocument();
    });

    it('saves the rotation-seconds setting', async () => {
        vi.mocked(api.put).mockResolvedValue(undefined);
        render(<AdminAds ads={[]} setting={setting} />);

        const input = screen.getByLabelText('Carousel rotation (seconds per ad)');
        await userEvent.clear(input);
        await userEvent.type(input, '10');
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(api.put).toHaveBeenCalledWith('/admin/ads/setting', { rotation_seconds: 10 }),
        );
    });
});
