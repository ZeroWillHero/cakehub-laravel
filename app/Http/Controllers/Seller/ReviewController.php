<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\RespondToReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $seller = $request->user()->seller;

        $reviews = $seller->reviews()
            ->with('customer')
            ->latest()
            ->get();

        return Inertia::render('Seller/Reviews', [
            'reviews' => ReviewResource::collection($reviews)->resolve(),
            'averageRating' => (float) $seller->average_rating,
        ]);
    }

    public function respond(RespondToReviewRequest $request, Review $review): JsonResponse
    {
        $review->update(['seller_response' => $request->validated('response')]);

        return (new ReviewResource($review->load(['customer', 'seller'])))->response();
    }
}
