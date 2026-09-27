import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SlipPreviewDialog from '@/components/shared/SlipPreviewDialog';

describe('SlipPreviewDialog', () => {
    it('renders nothing (no dialog) when closed', () => {
        render(<SlipPreviewDialog open={false} onOpenChange={() => {}} slipUrl="/api/payments/1" />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the image with correct src/alt when open', () => {
        render(<SlipPreviewDialog open onOpenChange={() => {}} slipUrl="/api/payments/1" />);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        const img = screen.getByRole('img', { name: 'Payment slip' });
        expect(img).toHaveAttribute('src', '/api/payments/1');
    });

    it('uses a custom title for the dialog heading and image alt text', () => {
        render(<SlipPreviewDialog open onOpenChange={() => {}} slipUrl="/api/payments/1" title="Payout slip" />);

        expect(screen.getByText('Payout slip')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Payout slip' })).toBeInTheDocument();
    });

    it('falls back to an iframe when the image fails to load', () => {
        render(<SlipPreviewDialog open onOpenChange={() => {}} slipUrl="/api/payments/1" />);

        const img = screen.getByRole('img', { name: 'Payment slip' });
        fireEvent.error(img);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        const iframe = document.querySelector('iframe');
        expect(iframe).toHaveAttribute('src', '/api/payments/1');
        expect(iframe).toHaveAttribute('title', 'Payment slip');
    });

    it('renders children in the footer when provided', () => {
        render(
            <SlipPreviewDialog open onOpenChange={() => {}} slipUrl="/api/payments/1">
                <button type="button">Approve</button>
            </SlipPreviewDialog>,
        );

        expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    });
});
