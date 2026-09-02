<?php

namespace App\Http\Requests\Seller;

use App\Models\SubscriptionPlan;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class SubscribeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->seller !== null;
    }

    public function rules(): array
    {
        return [
            'subscription_plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $plan = SubscriptionPlan::query()->find($this->input('subscription_plan_id'));

            if ($plan && ! $plan->is_active) {
                $validator->errors()->add('subscription_plan_id', 'This plan is no longer available.');
            }
        });
    }
}
