import { describe, expect, it } from 'vitest';
import { formatBytes, IMAGE_RULE, SLIP_RULE, validateFile } from '@/lib/files';

function fileOf(name: string, type: string, size: number) {
    const file = new File(['x'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
}

describe('validateFile', () => {
    it('accepts an allowed type under the size limit', () => {
        expect(validateFile(fileOf('cake.jpg', 'image/jpeg', 1024), IMAGE_RULE)).toBeNull();
    });

    it('explains an unsupported type in plain words', () => {
        expect(validateFile(fileOf('cake.gif', 'image/gif', 1024), IMAGE_RULE)).toBe(
            '"cake.gif" isn\'t a supported file. Please choose a JPG, PNG or WebP.',
        );
    });

    it('explains an oversized file with both sizes', () => {
        expect(validateFile(fileOf('slip.pdf', 'application/pdf', 12 * 1024 * 1024), SLIP_RULE)).toBe(
            '"slip.pdf" is too large (12.0 MB). Please choose one under 10.0 MB.',
        );
    });
});

describe('formatBytes', () => {
    it('formats B, KB and MB', () => {
        expect(formatBytes(500)).toBe('500 B');
        expect(formatBytes(2048)).toBe('2 KB');
        expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    });
});
