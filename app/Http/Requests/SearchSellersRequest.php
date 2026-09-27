<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchSellersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'gte:min_price'],
            'rating_min' => ['nullable', 'numeric', 'min:0', 'max:5'],
        ];
    }
}
