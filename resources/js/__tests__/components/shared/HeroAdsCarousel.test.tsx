import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HeroAdsCarousel from '@/components/shared/HeroAdsCarousel';
import { HERO_IMAGE } from '@/components/shared/PageHero';
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

function slides() {
    return screen.getAllByRole('group');
}

describe('HeroAdsCarousel', () => {
    it('renders nothing for an empty ads array', () => {
        const { container } = render(<HeroAdsCarousel ads={[]} rotationSeconds={5} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders each ad as a hero slide with its name as the title and description as the subtitle', () => {
        const ads = [
            ad({ id: 1, name: 'Birthday Bash', description: 'Get 10% off' }),
            ad({ id: 2, name: 'Wedding Special', description: null }),
        ];
        render(<HeroAdsCarousel ads={ads} rotationSeconds={5} />);

        expect(slides()).toHaveLength(2);
        expect(screen.getByRole('heading', { name: 'Birthday Bash' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Wedding Special' })).toBeInTheDocument();
        expect(screen.getByText('Get 10% off')).toBeInTheDocument();
    });

    it('uses the ad image as the slide background, layered over the default hero photo', () => {
        render(<HeroAdsCarousel ads={[ad({ image_url: 'https://cdn.example.com/ad.jpg' })]} rotationSeconds={5} />);

        const background = slides()[0].style.backgroundImage;
        expect(background).toContain('https://cdn.example.com/ad.jpg');
        expect(background).toContain(HERO_IMAGE);
        expect(background.indexOf('https://cdn.example.com/ad.jpg')).toBeLessThan(background.indexOf(HERO_IMAGE));
    });

    it('falls back to the default hero photo when the ad has no image', () => {
        render(<HeroAdsCarousel ads={[ad({ image_url: null })]} rotationSeconds={5} />);

        expect(slides()[0].style.backgroundImage).toContain(HERO_IMAGE);
    });

    it('shows a "Learn more" link opening in a new tab only for ads with a link URL', () => {
        const ads = [
            ad({ id: 1, name: 'Linked', link_url: 'https://example.com/promo' }),
            ad({ id: 2, name: 'Unlinked', link_url: null }),
        ];
        render(<HeroAdsCarousel ads={ads} rotationSeconds={5} />);

        const links = screen.getAllByRole('link', { name: /learn more/i });
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute('href', 'https://example.com/promo');
        expect(links[0]).toHaveAttribute('target', '_blank');
        expect(links[0]).toHaveAccessibleName('Learn more about Linked (opens in a new tab)');
    });

    it('renders the actions once, outside the sliding slides', () => {
        render(
            <HeroAdsCarousel
                ads={[ad({ id: 1 }), ad({ id: 2, name: 'Second' })]}
                rotationSeconds={5}
                actions={<button type="button">Shop now</button>}
            />,
        );

        const button = screen.getByRole('button', { name: 'Shop now' });
        expect(button).toBeInTheDocument();
        expect(slides().some((slide) => slide.contains(button))).toBe(false);
    });
});
