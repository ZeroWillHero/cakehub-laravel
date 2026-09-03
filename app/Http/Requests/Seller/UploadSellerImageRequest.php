<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class UploadSellerImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->seller !== null;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
