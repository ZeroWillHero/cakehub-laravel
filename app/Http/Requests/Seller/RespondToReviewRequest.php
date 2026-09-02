<?php

namespace App\Http\Requests\Seller;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class RespondToReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->seller?->id === $this->route('review')->seller_id;
    }

    public function rules(): array
    {
        return [
            'response' => ['required', 'string', 'max:2000'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($this->route('review')->seller_response !== null) {
                $validator->errors()->add('response', 'This review already has a response.');
            }
        });
    }
}
