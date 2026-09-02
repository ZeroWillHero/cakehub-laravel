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
        $review = $order->review()->create([
            'customer_id' => $order->customer_id,
            'seller_id' => $order->seller_id,
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
        ]);

        $order->seller->recalculateAverageRating();

        return (new ReviewResource($review->load(['customer', 'seller'])))
            ->response()
            ->setStatusCode(201);
    }
}
