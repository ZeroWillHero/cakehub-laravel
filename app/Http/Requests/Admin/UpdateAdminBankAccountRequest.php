<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminBankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    public function rules(): array
    {
        return [
            'bank_name' => ['sometimes', 'required', 'string', 'max:150'],
            'account_name' => ['sometimes', 'required', 'string', 'max:150'],
            'account_number' => ['sometimes', 'required', 'string', 'max:50'],
            'branch' => ['sometimes', 'nullable', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
