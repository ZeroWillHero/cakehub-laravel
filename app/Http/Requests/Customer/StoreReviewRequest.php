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
            'order_item_id' => ['nullable', 'integer', 'exists:order_items,id'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $order = $this->route('order');
            $orderItemId = $this->input('order_item_id');

            if ($order->status !== OrderStatus::Completed) {
                $validator->errors()->add('order', 'Only completed orders can be reviewed.');
            }

            if ($orderItemId !== null) {
                $item = $order->items->firstWhere('id', (int) $orderItemId);

                if ($item === null) {
                    $validator->errors()->add('order_item_id', 'That item does not belong to this order.');
                } elseif ($item->review()->exists()) {
                    $validator->errors()->add('order_item_id', 'This item has already been reviewed.');
                }
            } elseif ($order->review()->exists()) {
                $validator->errors()->add('order', 'This order has already been reviewed.');
            }
        });
    }
}
