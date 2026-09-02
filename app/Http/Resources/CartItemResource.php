<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CartItem
 */
class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product->name,
            'product_variant_id' => $this->product_variant_id,
            'variant_name' => $this->variant?->name,
            'quantity' => $this->quantity,
            'unit_price' => $this->unitPrice(),
            'line_total' => round($this->unitPrice() * $this->quantity, 2),
            'customization_notes' => $this->customization_notes,
            'seller' => [
                'id' => $this->seller->id,
                'business_name' => $this->seller->business_name,
                'slug' => $this->seller->slug,
            ],
        ];
    }
}
