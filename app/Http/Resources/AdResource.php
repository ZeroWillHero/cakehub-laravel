<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Ad
 */
class AdResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'image_path' => $this->image_path,
            'link_url' => $this->link_url,
            'paid_amount' => (float) $this->paid_amount,
            'status' => $this->status->value,
            'starts_at' => $this->starts_at->toDateString(),
            'ends_at' => $this->ends_at->toDateString(),
            'sort_order' => $this->sort_order,
            'created_by' => $this->created_by,
            'is_currently_visible' => $this->status === \App\Enums\AdStatus::Active
                && ! $this->starts_at->isAfter(today())
                && ! $this->ends_at->isBefore(today()),
        ];
    }
}
