import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

describe('SlipPreviewDialog missing file', () => {
    it('explains a missing file instead of showing an error page', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ status: 404 });
        vi.stubGlobal('fetch', fetchMock);

        render(<SlipPreviewDialog open onOpenChange={() => {}} slipUrl="/seller-documents/5" title="Business registration" />);
        fireEvent.error(screen.getByRole('img', { name: 'Business registration' }));

        expect(await screen.findByText("This file can't be found")).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledWith('/seller-documents/5', expect.objectContaining({ method: 'HEAD' }));
        expect(document.querySelector('iframe')).toBeNull();
        expect(screen.queryByText('Open in new tab')).not.toBeInTheDocument();

        vi.unstubAllGlobals();
    });

    it('keeps the PDF view when the file exists', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 0, type: 'opaqueredirect' }));

        render(<SlipPreviewDialog open onOpenChange={() => {}} slipUrl="/seller-documents/6" title="Food safety certificate" />);
        fireEvent.error(screen.getByRole('img', { name: 'Food safety certificate' }));

        await Promise.resolve();
        expect(document.querySelector('iframe')).toHaveAttribute('src', '/seller-documents/6');
        expect(screen.queryByText("This file can't be found")).not.toBeInTheDocument();

        vi.unstubAllGlobals();
    });
});
