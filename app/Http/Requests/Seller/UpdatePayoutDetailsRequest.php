<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePayoutDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->seller !== null;
    }

    public function rules(): array
    {
        return [
            'payout_bank_name' => ['nullable', 'string', 'max:255'],
            'payout_account_name' => ['nullable', 'string', 'max:255'],
            'payout_account_number' => ['nullable', 'string', 'max:64'],
        ];
    }
}
