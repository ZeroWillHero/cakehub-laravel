<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResolveCartMergeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // 'saved' keeps the account's existing cart; 'incoming' replaces
            // it with the cart built while signed out.
            'keep' => ['required', Rule::in(['saved', 'incoming'])],
        ];
    }
}
