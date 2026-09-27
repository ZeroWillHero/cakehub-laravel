<?php

return [
    /*
     * Resend API Key
     */
    'api_key' => env('RESEND_API_KEY'),

    /*
     * Resend From Email & Name
     */
    'from_email' => env('MAIL_FROM_ADDRESS', 'noreply@cakehub.local'),
    'from_name' => env('MAIL_FROM_NAME', 'CakeHub'),

    /*
     * Reply-to address for emails
     */
    'reply_to' => env('RESEND_REPLY_TO', env('MAIL_FROM_ADDRESS')),

    /*
     * Email tracking (if enabled via Resend)
     */
    'track_opens' => env('RESEND_TRACK_OPENS', true),
    'track_clicks' => env('RESEND_TRACK_CLICKS', true),
];
