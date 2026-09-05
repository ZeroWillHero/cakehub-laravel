<?php

namespace App\Http\Controllers;

use App\Http\Requests\SearchProductsRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Seller;
use Illuminate\Http\JsonResponse;
use MatanYadaev\EloquentSpatial\Objects\Point;

class ProductSearchController extends Controller
{
    public function search(SearchProductsRequest $request): JsonResponse
    {
        $data = $request->validated();

        $nearbySellerIds = null;
        $distanceBySeller = collect();

        if (isset($data['lat'], $data['lng'])) {
            $point = new Point($data['lat'], $data['lng']);
            $radiusMeters = ($data['radius_km'] ?? 10) * 1000;

            $nearbySellers = Seller::query()
                ->whereNotNull('location')
                ->withDistanceSphere('location', $point)
                ->whereDistanceSphere('location', $point, '<=', $radiusMeters)
                ->get(['id']);

            $nearbySellerIds = $nearbySellers->pluck('id');
            $distanceBySeller = $nearbySellers->pluck('distance', 'id');
        }

        $products = Product::query()
            ->active()
            ->with(['categories', 'variants', 'images', 'seller'])
            ->when(
                $data['q'] ?? null,
                fn ($query, $q) => $query->where(function ($inner) use ($q) {
                    $inner->where('name', 'ilike', "%{$q}%")
                        ->orWhere('description', 'ilike', "%{$q}%")
                        ->orWhereHas('seller', fn ($s) => $s->where('business_name', 'ilike', "%{$q}%"));
                }),
            )
            ->when(
                $data['category_id'] ?? null,
                fn ($query, $categoryId) => $query->whereHas(
                    'categories',
                    fn ($q) => $q->where('categories.id', $categoryId),
                ),
            )
            ->when($request->boolean('in_stock'), fn ($query) => $query->inStock())
            ->when($nearbySellerIds !== null, fn ($query) => $query->whereIn('seller_id', $nearbySellerIds))
            ->orderByDesc('average_rating')
            ->get();

        if ($nearbySellerIds !== null) {
            $products->each(function ($product) use ($distanceBySeller) {
                $product->setAttribute('distance', $distanceBySeller[$product->seller_id] ?? null);
            });
        }

        return ProductResource::collection($products)->response();
    }
}
