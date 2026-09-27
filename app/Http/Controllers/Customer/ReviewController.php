<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    public function store(StoreReviewRequest $request, Order $order): JsonResponse
    {
        $orderItemId = $request->validated('order_item_id');
        $orderItem = $orderItemId !== null ? $order->items->firstWhere('id', (int) $orderItemId) : null;

        $review = $order->reviews()->create([
            'order_item_id' => $orderItem?->id,
            'product_id' => $orderItem?->product_id,
            'customer_id' => $order->customer_id,
            'seller_id' => $order->seller_id,
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
        ]);

        $order->seller->recalculateAverageRating();
        $orderItem?->product?->recalculateAverageRating();

        return (new ReviewResource($review->load(['customer', 'seller'])))
            ->response()
            ->setStatusCode(201);
    }
}
