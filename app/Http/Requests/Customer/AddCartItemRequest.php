<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class AddCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
            'customization_notes' => ['nullable', 'string', 'max:1000'],
            // When the cart already holds a different seller's items, the
            // client must explicitly confirm the switch (see screens.md C8) —
            // this flag makes that confirmation an explicit, testable input
            // rather than silently overwriting the cart.
            'replace_cart' => ['boolean'],
        ];
    }
}
