import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/Pages/Customer/Home';
import type { Category } from '@/types/category';
import type { SharedAuthUser } from '@/types/shared';
import type { SubscriptionPlan } from '@/types/subscriptionPlan';

const page = vi.hoisted(() => ({ user: null as SharedAuthUser | null }));

vi.mock('@/Layouts/CustomerLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
    usePage: () => ({ props: { auth: { user: page.user } } }),
}));

vi.mock('embla-carousel-react', () => ({
    default: () => [() => {}, null],
}));

vi.mock('embla-carousel-autoplay', () => ({
    default: () => ({ name: 'autoplay' }),
}));

const plan = { id: 1, name: 'Starter', price: 0, billing_cycle: 'monthly', listing_limit: 5 } as SubscriptionPlan;

const category = { id: 3, name: 'Birthday Cakes', image_url: null } as Category;

function renderHome(subscriptionPlans: SubscriptionPlan[] = [plan], categories: Category[] = []) {
    render(
        <Home
            categories={categories}
            featuredSellers={[]}
            subscriptionPlans={subscriptionPlans}
            ads={[]}
            adRotationSeconds={5}
        />,
    );
}

describe('Customer Home', () => {
    beforeEach(() => {
        page.user = null;
    });

    it('pitches selling to a guest: "Become a seller" CTAs and the subscription plans', () => {
        renderHome();

        expect(screen.getAllByRole('link', { name: 'Become a seller' }).length).toBeGreaterThan(0);
        expect(screen.getByText('Sell your cakes on CakeHub')).toBeInTheDocument();
        expect(screen.getByText('Starter')).toBeInTheDocument();
    });

    it('shows a signed-in customer no "Become a seller" CTAs or subscription plans', () => {
        page.user = { id: 1, name: 'Buyer', email: 'buyer@example.com', avatar_url: null, role: 'customer' };
        // Plans passed anyway, so this proves the page hides them itself.
        renderHome();

        expect(screen.queryByRole('link', { name: 'Become a seller' })).not.toBeInTheDocument();
        expect(screen.queryByText('Sell your cakes on CakeHub')).not.toBeInTheDocument();
        expect(screen.queryByText('Starter')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Shop now' })).toBeInTheDocument();
    });

    it('shows each category as a card whose centered name links to that category search', () => {
        renderHome([], [category]);

        const card = screen.getByRole('link', { name: 'Birthday Cakes' });
        expect(card).toHaveAttribute('href', '/search?category_id=3');
        expect(screen.getByText('Birthday Cakes')).toHaveClass('font-bold');
    });

    it('places the categories directly under the hero, before the featured sections', () => {
        renderHome([], [category]);

        const categoriesHeading = screen.getByRole('heading', { name: 'Categories' });
        const featuredHeading = screen.getByRole('heading', { name: 'Featured cakes' });
        expect(categoriesHeading.compareDocumentPosition(featuredHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
});
