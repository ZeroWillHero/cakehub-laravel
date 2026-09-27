<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'order_status_email' => ['required', 'boolean'],
            'seller_verification_email' => ['required', 'boolean'],
            'subscription_status_email' => ['required', 'boolean'],
        ];
    }
}
