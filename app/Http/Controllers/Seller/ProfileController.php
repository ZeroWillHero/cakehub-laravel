<?php

namespace App\Http\Controllers\Seller;

use App\Helpers\CloudinaryHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProfileRequest;
use App\Http\Requests\Seller\UploadSellerImageRequest;
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
            'seller' => (new SellerResource(request()->user()->seller->load('documents')))->resolve(),
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

    public function uploadLogo(UploadSellerImageRequest $request): JsonResponse
    {
        return $this->uploadImage($request, 'logo_path');
    }

    public function uploadCover(UploadSellerImageRequest $request): JsonResponse
    {
        return $this->uploadImage($request, 'cover_path');
    }

    private function uploadImage(UploadSellerImageRequest $request, string $column): JsonResponse
    {
        $seller = $request->user()->seller;
        $this->authorize('update', $seller);

        $oldPath = $seller->{$column};

        $uploadResponse = CloudinaryHelper::upload(
            $request->file('image'),
            'sellers/' . $seller->id,
        );

        $seller->update([$column => $uploadResponse['public_id']]);

        if ($oldPath) {
            CloudinaryHelper::delete($oldPath);
        }

        return (new SellerResource($seller))->response();
    }
}
