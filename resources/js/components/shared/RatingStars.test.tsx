import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RatingStars from './RatingStars';

describe('RatingStars', () => {
    it('renders five stars with the given value filled', () => {
        render(<RatingStars value={3} />);
        const stars = screen.getAllByRole('button');
        expect(stars).toHaveLength(5);
        expect(stars[0]).toHaveClass('cursor-default');
    });

    it('is read-only when no onChange is given', () => {
        render(<RatingStars value={2} />);
        for (const star of screen.getAllByRole('button')) {
            expect(star).toBeDisabled();
        }
    });

    it('calls onChange with the clicked star value when interactive', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<RatingStars value={0} onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: '4 stars' }));

        expect(onChange).toHaveBeenCalledWith(4);
    });

    it('marks stars up to the current value as pressed when interactive', () => {
        render(<RatingStars value={3} onChange={() => {}} />);

        expect(screen.getByRole('button', { name: '3 stars' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: '4 stars' })).toHaveAttribute('aria-pressed', 'false');
    });
});
