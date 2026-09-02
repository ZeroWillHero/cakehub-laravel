<?php

namespace App\Http\Requests\Seller;

use App\Enums\OrderStatus;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->seller !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(OrderStatus::class)],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $order = $this->route('order');
            $requested = $this->input('status');

            if (! $requested || ! $order) {
                return;
            }

            $allowed = $order->status->allowedNextStatuses();
            $allowedValues = array_map(fn ($s) => $s->value, $allowed);

            if (! in_array($requested, $allowedValues, true)) {
                $validator->errors()->add(
                    'status',
                    "Cannot move an order from \"{$order->status->value}\" to \"{$requested}\".",
                );
            }
        });
    }
}
