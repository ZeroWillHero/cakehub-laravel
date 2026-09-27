<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Product
 */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'base_price' => (float) $this->base_price,
            'average_rating' => (float) $this->average_rating,
            'preparation_time_hours' => $this->preparation_time_hours,
            'availability_status' => $this->availability_status?->value,
            'is_active' => $this->is_active,
            'categories' => $this->whenLoaded(
                'categories',
                fn () => CategoryResource::collection($this->categories)->resolve(),
                [],
            ),
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'price_modifier' => (float) $v->price_modifier,
                'is_default' => $v->is_default,
            ]), []),
            'images' => $this->whenLoaded(
                'images',
                fn () => ProductImageResource::collection($this->images)->resolve(),
                [],
            ),
            'reviews' => $this->whenLoaded(
                'reviews',
                fn () => ReviewResource::collection($this->reviews)->resolve(),
            ),
            'seller' => $this->whenLoaded('seller', fn () => [
                'id' => $this->seller->id,
                'business_name' => $this->seller->business_name,
                'slug' => $this->seller->slug,
                'address_line' => $this->seller->address_line,
                'average_rating' => (float) $this->seller->average_rating,
            ]),
            // Present only when the query computed a distance (in meters)
            // via a location-filtered product search — see ProductSearchController.
            'distance_km' => $this->when(
                array_key_exists('distance', $this->resource->getAttributes()),
                fn () => round(((float) $this->resource->getAttributes()['distance']) / 1000, 2),
            ),
        ];
    }
}
