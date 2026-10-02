import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FileDropzone from '@/components/shared/FileDropzone';
import { IMAGE_RULE } from '@/lib/files';

describe('FileDropzone', () => {
    it('exposes the file input under the visible label and shows the size/type hint', () => {
        render(<FileDropzone label="Add product photos" rule={IMAGE_RULE} onFiles={vi.fn()} />);

        expect(screen.getByLabelText(/add product photos/i)).toHaveAttribute('type', 'file');
        expect(screen.getByText(/JPG, PNG or WebP · up to 20.0 MB/)).toBeInTheDocument();
    });

    it('passes valid files through and reports invalid ones without sending them', async () => {
        const onFiles = vi.fn();
        render(<FileDropzone label="Add photos" rule={IMAGE_RULE} multiple onFiles={onFiles} />);

        const good = new File(['a'], 'good.png', { type: 'image/png' });
        const big = new File(['b'], 'big.jpg', { type: 'image/jpeg' });
        Object.defineProperty(big, 'size', { value: 25 * 1024 * 1024 });

        await userEvent.upload(screen.getByLabelText(/add photos/i), [good, big]);

        expect(onFiles).toHaveBeenCalledWith([good]);
        expect(screen.getByRole('alert')).toHaveTextContent('"big.jpg" is too large (25.0 MB)');
    });

    it('shows a server error passed in by the parent', () => {
        render(<FileDropzone label="Add photo" rule={IMAGE_RULE} onFiles={vi.fn()} error="Upload failed." />);
        expect(screen.getByRole('alert')).toHaveTextContent('Upload failed.');
    });
});
