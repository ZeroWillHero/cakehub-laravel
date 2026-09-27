<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\UpdatePayoutDetailsRequest;
use App\Http\Resources\SellerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Seller/Settings', [
            'seller' => (new SellerResource($request->user()->seller))->resolve(),
            'notificationPreferences' => $request->user()->notification_preferences,
        ]);
    }

    public function updatePayout(UpdatePayoutDetailsRequest $request): JsonResponse
    {
        $seller = $request->user()->seller;
        $this->authorize('update', $seller);

        $seller->update($request->validated());

        return (new SellerResource($seller))->response();
    }
}
