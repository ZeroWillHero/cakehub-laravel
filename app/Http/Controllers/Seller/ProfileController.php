<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProfileRequest;
use App\Http\Resources\SellerResource;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use MatanYadaev\EloquentSpatial\Objects\Point;

class ProfileController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Seller/StoreProfile', [
            'seller' => (new SellerResource(request()->user()->seller))->resolve(),
        ]);
    }

    public function update(StoreProfileRequest $request): JsonResponse
    {
        $seller = $request->user()->seller;
        $this->authorize('update', $seller);

        $data = $request->validated();
        $point = isset($data['latitude'], $data['longitude'])
            ? new Point($data['latitude'], $data['longitude'])
            : $seller->location;

        $seller->update([
            ...collect($data)->except(['latitude', 'longitude'])->all(),
            'location' => $point,
        ]);

        return (new SellerResource($seller))->response();
    }
}
