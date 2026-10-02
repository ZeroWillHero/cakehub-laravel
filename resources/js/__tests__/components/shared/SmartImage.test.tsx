import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SmartImage from '@/components/shared/SmartImage';

describe('SmartImage', () => {
    it('renders the photo hidden behind a shimmer until it loads', () => {
        render(<SmartImage src="/cake.jpg" alt="Chocolate cake" />);

        const img = screen.getByRole('img', { name: 'Chocolate cake' });
        expect(img).toHaveClass('opacity-0');
        fireEvent.load(img);
        expect(img).toHaveClass('opacity-100');
    });

    it('swaps a broken image for a friendly "no photo" tile', () => {
        render(<SmartImage src="/missing.jpg" alt="Chocolate cake" />);

        fireEvent.error(screen.getByRole('img', { name: 'Chocolate cake' }));

        expect(document.querySelector('img')).toBeNull();
        expect(screen.getByRole('img', { name: 'Chocolate cake' })).toHaveTextContent('No photo yet');
    });

    it('shows the fallback straight away when there is no URL', () => {
        render(<SmartImage src={null} alt="Logo" fallbackLabel="No logo" />);
        expect(screen.getByRole('img', { name: 'Logo' })).toHaveTextContent('No logo');
    });
});
