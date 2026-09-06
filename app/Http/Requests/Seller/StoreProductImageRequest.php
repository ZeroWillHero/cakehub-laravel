<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->seller !== null;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:20480'],
        ];
    }
}
