<?php

namespace App\Http\Requests\GuestCart;

use App\Http\Requests\Customer\AddCartItemRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;

/**
 * Same body as POST /api/cart, but for signed-out visitors' session cart.
 * Also checks the variant belongs to the product, since guest lines are
 * re-validated only at sign-in (CartMerger) rather than by a DB FK.
 */
class AddGuestCartItemRequest extends AddCartItemRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function withValidator(ValidatorContract $validator): void
    {
        parent::withValidator($validator);

        $validator->after(function (ValidatorContract $validator) {
            if (! $validator->errors()->has('product_id')
                && ! Product::query()->whereKey($this->input('product_id'))->where('is_active', true)->exists()) {
                $validator->errors()->add('product_id', 'This cake is not currently available.');
            }

            $variantId = $this->input('product_variant_id');
            if ($variantId === null || $validator->errors()->has('product_id')) {
                return;
            }

            $belongs = ProductVariant::query()
                ->whereKey($variantId)
                ->where('product_id', $this->input('product_id'))
                ->exists();

            if (! $belongs) {
                $validator->errors()->add('product_variant_id', 'That option does not belong to this product.');
            }
        });
    }
}
