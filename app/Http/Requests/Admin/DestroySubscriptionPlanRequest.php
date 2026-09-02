<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use App\Models\SellerSubscription;
use App\Enums\SellerSubscriptionStatus;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class DestroySubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    public function rules(): array
    {
        return [
            'migrate_to' => ['nullable', 'integer', 'exists:subscription_plans,id'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $plan = $this->route('plan');
            $hasSubscribers = SellerSubscription::query()
                ->where('subscription_plan_id', $plan->id)
                ->where('status', SellerSubscriptionStatus::Active)
                ->exists();

            if ($hasSubscribers && ! $this->input('migrate_to')) {
                $validator->errors()->add(
                    'migrate_to',
                    'This plan has active subscribers — choose a plan to migrate them to before deleting.',
                );
            }

            if ($this->input('migrate_to') && (int) $this->input('migrate_to') === $plan->id) {
                $validator->errors()->add('migrate_to', 'Choose a different plan to migrate subscribers to.');
            }
        });
    }
}
