<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NearbySellersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'radius_km' => ['nullable', 'numeric', 'min:0.1', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ];
    }
}
