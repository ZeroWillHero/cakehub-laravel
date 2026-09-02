<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Address
 */
class AddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'line1' => $this->line1,
            'line2' => $this->line2,
            'city' => $this->city,
            'postal_code' => $this->postal_code,
            'latitude' => $this->location?->latitude,
            'longitude' => $this->location?->longitude,
            'is_default' => $this->is_default,
        ];
    }
}
