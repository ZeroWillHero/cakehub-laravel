<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Payment
 */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payable_type' => $this->payable_type === \App\Models\Order::class ? 'order' : 'subscription',
            'payable_id' => $this->payable_id,
            'method' => $this->method->value,
            'amount' => (float) $this->amount,
            'admin_bank_account' => $this->whenLoaded(
                'adminBankAccount',
                fn () => $this->adminBankAccount ? (new AdminBankAccountResource($this->adminBankAccount))->resolve() : null,
            ),
            'status' => $this->status->value,
            'rejection_reason' => $this->rejection_reason,
            'submitted_by' => $this->whenLoaded('submittedBy', fn () => [
                'id' => $this->submittedBy->id,
                'name' => $this->submittedBy->name,
            ]),
            'verified_by' => $this->whenLoaded('verifiedBy', fn () => $this->verifiedBy ? [
                'id' => $this->verifiedBy->id,
                'name' => $this->verifiedBy->name,
            ] : null),
            'verified_at' => $this->verified_at?->toIso8601String(),
            'payable' => $this->whenLoaded('payable', fn () => $this->payable instanceof \App\Models\Order
                ? (new OrderResource($this->payable))->resolve()
                : (new SellerSubscriptionResource($this->payable->load('subscriptionPlan')))->resolve()),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
