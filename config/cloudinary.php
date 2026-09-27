<?php

return [
    /*
     * Cloudinary configuration for image and file storage
     */

    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key' => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),

    /*
     * Default upload options for all files
     */
    'upload_options' => [
        'resource_type' => 'auto', // handles both images and pdfs
        'use_filename' => true,
        'unique_filename' => true,
        'overwrite' => false,
    ],

    /*
     * Image transformation presets
     */
    'transformations' => [
        'thumbnail' => 'c_scale,w_200,h_200,f_auto,q_auto',
        'medium' => 'c_scale,w_400,h_400,f_auto,q_auto',
        'large' => 'c_scale,w_800,h_800,f_auto,q_auto',
    ],

    /*
     * Folder structure for organizing uploads
     */
    'folders' => [
        'products' => 'products',
        'sellers' => 'sellers',
        'categories' => 'categories',
        'ads' => 'ads',
        'documents' => 'seller_documents',
    ],
];
