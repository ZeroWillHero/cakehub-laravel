<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\SellerPayout
 */
class SellerPayoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'amount' => (float) $this->amount,
            'status' => $this->status->value,
            'has_slip' => $this->slip_path !== null,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'seller' => $this->whenLoaded('seller', fn () => [
                'id' => $this->seller->id,
                'business_name' => $this->seller->business_name,
            ]),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order->id,
                'total' => (float) $this->order->total,
            ]),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
