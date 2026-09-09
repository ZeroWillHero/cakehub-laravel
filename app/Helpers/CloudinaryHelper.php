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
            self::$client = new Cloudinary([
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key' => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
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
