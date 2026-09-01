<?php

namespace App\Http\Requests\Onboarding;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class SelectRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === null;
    }

    public function rules(): array
    {
        return [
            'role' => ['required', new Enum(UserRole::class), 'in:customer,seller'],
            'business_name' => ['nullable', 'required_if:role,seller', 'string', 'max:255'],
            'whatsapp_number' => ['nullable', 'required_if:role,seller', 'string', 'max:32'],
        ];
    }
}
