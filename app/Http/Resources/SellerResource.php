<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Seller
 */
class SellerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_name' => $this->business_name,
            'slug' => $this->slug,
            'description' => $this->description,
            'logo_path' => $this->logo_path,
            'cover_path' => $this->cover_path,
            'whatsapp_number' => $this->whatsapp_number,
            'address_line' => $this->address_line,
            'latitude' => $this->location?->latitude,
            'longitude' => $this->location?->longitude,
            'operating_hours' => $this->operating_hours,
            'store_status' => $this->store_status?->value,
            'verification_status' => $this->verification_status?->value,
            'average_rating' => (float) $this->average_rating,
            // Present only when the query computed a distance (in meters)
            // via the `nearby` search — see SellerSearchController.
            'distance_km' => $this->when(
                array_key_exists('distance', $this->resource->getAttributes()),
                fn () => round(((float) $this->resource->getAttributes()['distance']) / 1000, 2),
            ),
        ];
    }
}
