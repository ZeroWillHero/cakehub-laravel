<?php

namespace App\Http\Requests\Api;

use App\Models\Order;
use App\Models\SellerSubscription;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitPaymentSlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'payable_type' => ['required', Rule::in(['order', 'subscription'])],
            'payable_id' => ['required', 'integer'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'admin_bank_account_id' => ['required', 'integer', 'exists:admin_bank_accounts,id'],
            'reference' => ['nullable', 'string', 'max:255'],
            'slip' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $payable = $this->resolvePayable();

            if (! $payable) {
                $validator->errors()->add('payable_id', 'That order or subscription could not be found.');

                return;
            }

            $user = $this->user();

            if ($payable instanceof Order && $payable->customer_id !== $user->id) {
                $validator->errors()->add('payable_id', 'You do not own this order.');
            }

            if ($payable instanceof SellerSubscription && $payable->seller->user_id !== $user->id) {
                $validator->errors()->add('payable_id', 'You do not own this subscription.');
            }
        });
    }

    public function resolvePayable(): Order|SellerSubscription|null
    {
        $id = $this->input('payable_id');

        return match ($this->input('payable_type')) {
            'order' => Order::query()->find($id),
            'subscription' => SellerSubscription::query()->find($id),
            default => null,
        };
    }
}
