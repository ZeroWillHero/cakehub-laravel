<?php

namespace App\Http\Requests\Customer;

use App\Enums\OrderStatus;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('review', $this->route('order')) ?? false;
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $order = $this->route('order');

            if ($order->status !== OrderStatus::Completed) {
                $validator->errors()->add('order', 'Only completed orders can be reviewed.');
            }

            if ($order->review()->exists()) {
                $validator->errors()->add('order', 'This order has already been reviewed.');
            }
        });
    }
}
