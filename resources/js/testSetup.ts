import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement object URLs; upload previews (SelectedFile,
// ImageUploadField, ProductPhotoManager) need them.
if (!URL.createObjectURL) {
    URL.createObjectURL = () => 'blob:preview';
    URL.revokeObjectURL = () => {};
}
