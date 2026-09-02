<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Order
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'allowed_next_statuses' => array_map(fn ($s) => $s->value, $this->status->allowedNextStatuses()),
            'delivery_type' => $this->delivery_type->value,
            'delivery_address' => $this->whenLoaded(
                'deliveryAddress',
                fn () => $this->deliveryAddress ? (new AddressResource($this->deliveryAddress))->resolve() : null,
            ),
            'scheduled_at' => $this->scheduled_at->toIso8601String(),
            'subtotal' => (float) $this->subtotal,
            'delivery_fee' => (float) $this->delivery_fee,
            'total' => (float) $this->total,
            'payment_status' => $this->payment_status->value,
            'cancelled_reason' => $this->cancelled_reason,
            'created_at' => $this->created_at->toIso8601String(),
            'seller' => $this->whenLoaded('seller', fn () => [
                'id' => $this->seller->id,
                'business_name' => $this->seller->business_name,
                'slug' => $this->seller->slug,
                'whatsapp_number' => $this->seller->whatsapp_number,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'customization_notes' => $item->customization_notes,
            ]), []),
            'review' => $this->whenLoaded('review', fn () => $this->review ? (new ReviewResource($this->review))->resolve() : null),
        ];
    }
}
