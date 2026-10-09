<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * One row of the A8 User Management list (docs/screens.md). Customer rows
 * carry order totals; seller rows carry their store summary. Deliberately
 * not SellerResource — the list never needs payout/location/document fields.
 *
 * @mixin \App\Models\User
 */
class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'role' => $this->role?->value,
            'status' => $this->status->value,
            'created_at' => $this->created_at?->toIso8601String(),
            'orders_count' => $this->whenCounted('orders'),
            // Sum/max come back null for a customer with no orders yet — show
            // that as $0 / never rather than dropping the field.
            'orders_total' => $this->when(
                array_key_exists('orders_sum_total', $this->getAttributes()),
                fn () => (float) ($this->orders_sum_total ?? 0),
            ),
            'last_order_at' => $this->when(
                array_key_exists('orders_max_created_at', $this->getAttributes()),
                fn () => $this->orders_max_created_at ? Carbon::parse($this->orders_max_created_at)->toIso8601String() : null,
            ),
            'seller' => $this->whenLoaded('seller', fn () => $this->seller ? [
                'id' => $this->seller->id,
                'business_name' => $this->seller->business_name,
                'slug' => $this->seller->slug,
                'verification_status' => $this->seller->verification_status?->value,
                'products_count' => (int) $this->seller->products_count,
                'orders_count' => (int) $this->seller->orders_count,
            ] : null),
        ];
    }
}
