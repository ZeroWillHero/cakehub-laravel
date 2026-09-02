<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Seller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function bySeller(Request $request, Seller $seller): JsonResponse
    {
        $products = $seller->products()
            ->active()
            ->with(['categories', 'variants', 'images'])
            ->when(
                $request->query('category_id'),
                fn ($query, $categoryId) => $query->whereHas(
                    'categories',
                    fn ($q) => $q->where('categories.id', $categoryId),
                ),
            )
            ->get();

        return ProductResource::collection($products)->response();
    }
}
