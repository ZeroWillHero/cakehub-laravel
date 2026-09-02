import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ListingUsageIndicator from './ListingUsageIndicator';

describe('ListingUsageIndicator', () => {
    it('shows usage against a finite limit', () => {
        render(<ListingUsageIndicator usage={3} limit={5} />);
        expect(screen.getByText('3 / 5')).toBeInTheDocument();
    });

    it('shows "unlimited" when limit is null', () => {
        render(<ListingUsageIndicator usage={3} limit={null} />);
        expect(screen.getByText('3 (unlimited)')).toBeInTheDocument();
    });

    it('does not render a progress bar when unlimited', () => {
        const { container } = render(<ListingUsageIndicator usage={3} limit={null} />);
        expect(container.querySelector('.bg-primary, .bg-destructive')).not.toBeInTheDocument();
    });

    it('highlights usage as at-limit once usage reaches the limit', () => {
        render(<ListingUsageIndicator usage={5} limit={5} />);
        expect(screen.getByText('5 / 5')).toHaveClass('text-destructive');
    });

    it('does not mark usage under the limit as at-limit', () => {
        render(<ListingUsageIndicator usage={4} limit={5} />);
        expect(screen.getByText('4 / 5')).not.toHaveClass('text-destructive');
    });
});
