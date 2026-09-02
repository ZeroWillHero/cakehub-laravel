<?php

namespace App\Http\Requests\Seller;

use App\Enums\ProductAvailabilityStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->seller !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'preparation_time_hours' => ['nullable', 'integer', 'min:0'],
            'availability_status' => ['required', new Enum(ProductAvailabilityStatus::class)],
            'is_active' => ['boolean'],
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'variants' => ['nullable', 'array'],
            'variants.*.name' => ['required_with:variants', 'string', 'max:255'],
            'variants.*.price_modifier' => ['nullable', 'numeric'],
            'variants.*.is_default' => ['boolean'],
        ];
    }
}
