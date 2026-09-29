import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdsCarousel from '@/components/shared/AdsCarousel';
import type { Ad } from '@/types/ad';

vi.mock('embla-carousel-react', () => ({
    default: () => [() => {}, null],
}));

vi.mock('embla-carousel-autoplay', () => ({
    default: () => ({ name: 'autoplay' }),
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

describe('AdsCarousel', () => {
    it('renders nothing for an empty ads array', () => {
        const { container } = render(<AdsCarousel ads={[]} rotationSeconds={5} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders each ad name (and description) when ads are present', () => {
        const ads = [
            ad({ id: 1, name: 'Birthday Bash', description: 'Get 10% off' }),
            ad({ id: 2, name: 'Wedding Special', description: null }),
        ];
        render(<AdsCarousel ads={ads} rotationSeconds={5} />);

        expect(screen.getAllByText('Birthday Bash').length).toBeGreaterThan(0);
        expect(screen.getByText('Get 10% off')).toBeInTheDocument();
        expect(screen.getAllByText('Wedding Special').length).toBeGreaterThan(0);
    });
});
