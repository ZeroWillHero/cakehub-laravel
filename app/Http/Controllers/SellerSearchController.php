<?php

namespace App\Http\Controllers;

use App\Http\Requests\NearbySellersRequest;
use App\Http\Requests\SearchSellersRequest;
use App\Http\Resources\SellerResource;
use App\Models\Seller;
use Illuminate\Http\JsonResponse;
use MatanYadaev\EloquentSpatial\Objects\Point;

class SellerSearchController extends Controller
{
    public function nearby(NearbySellersRequest $request): JsonResponse
    {
        $data = $request->validated();
        $point = new Point($data['lat'], $data['lng']);
        $radiusMeters = ($data['radius_km'] ?? 10) * 1000;

        $sellers = Seller::query()
            ->whereNotNull('location')
            ->when(
                $data['category_id'] ?? null,
                fn ($query, $categoryId) => $query->whereHas(
                    'products.categories',
                    fn ($q) => $q->where('categories.id', $categoryId),
                ),
            )
            ->when(
                isset($data['min_price']) || isset($data['max_price']),
                fn ($query) => $query->whereHas('products', function ($q) use ($data) {
                    if (isset($data['min_price'])) {
                        $q->where('base_price', '>=', $data['min_price']);
                    }
                    if (isset($data['max_price'])) {
                        $q->where('base_price', '<=', $data['max_price']);
                    }
                }),
            )
            ->when(
                $data['rating_min'] ?? null,
                fn ($query, $ratingMin) => $query->where('average_rating', '>=', $ratingMin),
            )
            // ->withDistance/whereDistance cast to ::geometry, computing
            // planar (degree-unit) distance rather than real-world meters
            // even though `location` is a geography column — use the
            // Sphere variants (ST_DistanceSphere) for correct meters.
            ->withDistanceSphere('location', $point)
            ->whereDistanceSphere('location', $point, '<=', $radiusMeters)
            ->orderByDistanceSphere('location', $point)
            ->get();

        return SellerResource::collection($sellers)->response();
    }

    public function search(SearchSellersRequest $request): JsonResponse
    {
        $data = $request->validated();

        $sellers = Seller::query()
            ->when(
                $data['q'] ?? null,
                fn ($query, $q) => $query->where('business_name', 'ilike', "%{$q}%"),
            )
            ->when(
                $data['category_id'] ?? null,
                fn ($query, $categoryId) => $query->whereHas(
                    'products.categories',
                    fn ($q) => $q->where('categories.id', $categoryId),
                ),
            )
            ->when(
                isset($data['min_price']) || isset($data['max_price']),
                fn ($query) => $query->whereHas('products', function ($q) use ($data) {
                    if (isset($data['min_price'])) {
                        $q->where('base_price', '>=', $data['min_price']);
                    }
                    if (isset($data['max_price'])) {
                        $q->where('base_price', '<=', $data['max_price']);
                    }
                }),
            )
            ->when(
                $data['rating_min'] ?? null,
                fn ($query, $ratingMin) => $query->where('average_rating', '>=', $ratingMin),
            )
            ->orderByDesc('average_rating')
            ->get();

        return SellerResource::collection($sellers)->response();
    }
}
