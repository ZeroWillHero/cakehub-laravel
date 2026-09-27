<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\CloudinaryHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdsRequest;
use App\Http\Requests\Admin\StoreAdRequest;
use App\Http\Requests\Admin\UpdateAdRequest;
use App\Http\Requests\Admin\UpdateAdSettingRequest;
use App\Http\Requests\Admin\UploadAdImageRequest;
use App\Http\Resources\AdResource;
use App\Models\Ad;
use App\Models\AdSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdController extends Controller
{
    public function index(Request $request): Response
    {
        $ads = Ad::query()->orderBy('sort_order')->get();

        return Inertia::render('Admin/Ads', [
            'ads' => AdResource::collection($ads)->resolve(),
            'setting' => ['rotation_seconds' => AdSetting::current()->rotation_seconds],
        ]);
    }

    public function store(StoreAdRequest $request): JsonResponse
    {
        $ad = Ad::query()->create([
            'status' => 'draft',
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'sort_order' => Ad::query()->max('sort_order') + 1,
        ]);

        return (new AdResource($ad))->response()->setStatusCode(201);
    }

    public function update(UpdateAdRequest $request, Ad $ad): JsonResponse
    {
        $ad->update($request->validated());

        return (new AdResource($ad))->response();
    }

    public function uploadImage(UploadAdImageRequest $request, Ad $ad): JsonResponse
    {
        $oldPath = $ad->image_path;

        $uploadResponse = CloudinaryHelper::upload(
            $request->file('image'),
            'ads',
        );

        $ad->update(['image_path' => $uploadResponse['public_id']]);

        if ($oldPath) {
            CloudinaryHelper::delete($oldPath);
        }

        return (new AdResource($ad))->response();
    }

    public function destroy(Ad $ad): JsonResponse
    {
        if ($ad->image_path) {
            CloudinaryHelper::delete($ad->image_path);
        }

        $ad->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function reorder(ReorderAdsRequest $request): JsonResponse
    {
        DB::transaction(function () use ($request) {
            foreach ($request->validated('order') as $index => $adId) {
                Ad::query()->whereKey($adId)->update(['sort_order' => $index]);
            }
        });

        return response()->json(['data' => ['reordered' => true]]);
    }

    public function updateSetting(UpdateAdSettingRequest $request): JsonResponse
    {
        $setting = AdSetting::current();
        $setting->update($request->validated());

        return response()->json(['data' => ['rotation_seconds' => $setting->rotation_seconds]]);
    }
}
