<?php

namespace App\Http\Resources;

use App\Helpers\CloudinaryHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ProductImage
 */
class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => CloudinaryHelper::getImageUrl($this->path),
            'sort_order' => $this->sort_order,
        ];
    }
}
