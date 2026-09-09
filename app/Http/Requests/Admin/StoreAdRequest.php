<?php

namespace App\Http\Requests\Admin;

use App\Enums\AdStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'link_url' => ['nullable', 'url', 'max:2048'],
            'paid_amount' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::enum(AdStatus::class)],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
