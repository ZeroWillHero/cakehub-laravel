import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ProductGallery from '@/components/shared/ProductGallery';

const images = [
    { id: 1, url: '/a.jpg' },
    { id: 2, url: '/b.jpg' },
    { id: 3, url: '/c.jpg' },
];

describe('ProductGallery', () => {
    it('shows every photo as a thumbnail and switches the main photo on click', async () => {
        render(<ProductGallery images={images} name="Red velvet" />);

        expect(screen.getByRole('img', { name: 'Red velvet — photo 1' })).toHaveAttribute('src', '/a.jpg');
        await userEvent.click(screen.getByRole('button', { name: 'Show photo 3' }));
        expect(screen.getByRole('img', { name: 'Red velvet — photo 3' })).toHaveAttribute('src', '/c.jpg');
        expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('steps with the arrow buttons, wrapping around', async () => {
        render(<ProductGallery images={images} name="Red velvet" />);

        await userEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
        expect(screen.getByRole('img', { name: 'Red velvet — photo 3' })).toBeInTheDocument();
    });

    it('opens the full-screen viewer when the main photo is tapped', async () => {
        render(<ProductGallery images={images} name="Red velvet" />);

        await userEvent.click(screen.getByRole('button', { name: /enlarge photo 1/i }));

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Photo 1 of 3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close photo viewer' })).toBeInTheDocument();
    });

    it('shows a placeholder when there are no photos', () => {
        render(<ProductGallery images={[]} name="Red velvet" />);
        expect(screen.getByRole('img', { name: 'Red velvet' })).toHaveTextContent('No photos yet');
    });
});
