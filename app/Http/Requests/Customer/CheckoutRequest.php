<?php

namespace App\Http\Requests\Customer;

use App\Enums\DeliveryType;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'delivery_type' => ['required', new Enum(DeliveryType::class)],
            'delivery_address_id' => ['required_if:delivery_type,delivery', 'nullable', 'integer', 'exists:addresses,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($this->user()->cartItems()->count() === 0) {
                $validator->errors()->add('cart', 'Your cart is empty.');
            } elseif ($this->user()->cartItems()->whereDoesntHave('seller', fn ($query) => $query->publiclyVisible())->exists()) {
                $validator->errors()->add('cart', 'This seller is not currently accepting orders.');
            }

            $addressId = $this->input('delivery_address_id');
            if ($addressId && ! $this->user()->addresses()->whereKey($addressId)->exists()) {
                $validator->errors()->add('delivery_address_id', 'That address does not belong to you.');
            }
        });
    }
}
