<?php

namespace App\Helpers;

use Cloudinary\Cloudinary;

class CloudinaryHelper
{
    protected static ?Cloudinary $client = null;

    /**
     * Get Cloudinary client instance
     */
    public static function client(): Cloudinary
    {
        if (self::$client === null) {
            $cloudName = config('cloudinary.cloud_name');
            $apiKey = config('cloudinary.api_key');
            $apiSecret = config('cloudinary.api_secret');

            // Provide default test credentials if not configured
            if (app()->environment('testing') && ! $cloudName) {
                $cloudName = 'test-cloud';
                $apiKey = 'test-key';
                $apiSecret = 'test-secret';
            }

            self::$client = new Cloudinary([
                'cloud_name' => $cloudName,
                'api_key' => $apiKey,
                'api_secret' => $apiSecret,
            ]);
        }

        return self::$client;
    }

    /**
     * Upload a file to Cloudinary
     *
     * @param mixed $file File from request
     * @param string $folder Cloudinary folder path
     * @param array $options Additional upload options
     * @return array Upload response with public_id
     */
    public static function upload($file, string $folder, array $options = []): array
    {
        // In testing environment without real credentials, generate a fake public_id
        if (app()->environment('testing') && ! config('cloudinary.cloud_name')) {
            return [
                'public_id' => "{$folder}/" . uniqid() . '_' . pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'secure_url' => 'https://res.cloudinary.com/test-cloud/image/upload/v1/test.jpg',
                'format' => 'jpg',
            ];
        }

        $uploadOptions = array_merge(
            config('cloudinary.upload_options'),
            ['folder' => $folder],
            $options
        );

        $response = self::client()->uploadApi()->upload($file->getRealPath(), $uploadOptions);

        return (array) $response;
    }

    /**
     * Delete a file from Cloudinary
     *
     * @param string $publicId Public ID of the file to delete
     * @return array Deletion response
     */
    public static function delete(string $publicId): array
    {
        // In testing environment without real credentials, just return success
        if (app()->environment('testing') && ! config('cloudinary.cloud_name')) {
            return [
                'result' => 'ok',
            ];
        }

        $response = self::client()->uploadApi()->destroy($publicId);

        return (array) $response;
    }

    /**
     * Generate a Cloudinary image URL
     *
     * @param string $publicId Public ID of the image
     * @param array $transforms Transformation options
     * @return string Full Cloudinary URL
     */
    public static function getImageUrl(string $publicId, array $transforms = []): string
    {
        if (empty($publicId)) {
            return '';
        }

        $cloudName = config('cloudinary.cloud_name');

        // If not configured, return empty string instead of invalid test URL
        if (!$cloudName || $cloudName === 'test-cloud') {
            return '';
        }

        // Build transformation string
        $transformString = '';
        if (!empty($transforms)) {
            $transformString = implode(',', $transforms) . '/';
        }

        return "https://res.cloudinary.com/{$cloudName}/image/upload/{$transformString}{$publicId}";
    }

    /**
     * Generate a Cloudinary PDF/document URL
     *
     * @param string $publicId Public ID of the document
     * @return string Full Cloudinary URL
     */
    public static function getDocumentUrl(string $publicId): string
    {
        if (empty($publicId)) {
            return '';
        }

        $cloudName = config('cloudinary.cloud_name');

        // If not configured, return empty string instead of invalid test URL
        if (!$cloudName || $cloudName === 'test-cloud') {
            return '';
        }

        return "https://res.cloudinary.com/{$cloudName}/image/upload/{$publicId}";
    }

    /**
     * Generate transformation URL for an image
     *
     * @param string $publicId Public ID
     * @param string $preset Preset name (e.g., 'thumbnail', 'medium', 'large')
     * @return string Transformed URL
     */
    public static function getTransformedUrl(string $publicId, string $preset = 'medium'): string
    {
        $transforms = config('cloudinary.transformations.' . $preset);

        return self::getImageUrl($publicId, [$transforms]);
    }
}
