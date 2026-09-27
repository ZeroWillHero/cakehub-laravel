<?php

namespace App\Http\Controllers\Api;

use App\Enums\SellerPayoutStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\SellerPayoutResource;
use App\Models\SellerPayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SellerPayoutController extends Controller
{
    public function index(): JsonResponse
    {
        $seller = auth()->user()->seller;

        $payouts = $seller->payouts()->with('order')->latest()->get();

        return SellerPayoutResource::collection($payouts)->response();
    }

    public function show(SellerPayout $payout): StreamedResponse
    {
        $this->authorize('view', $payout);

        abort_unless($payout->slip_path, 404);

        return Storage::disk('local')->response($payout->slip_path);
    }

    public function confirm(SellerPayout $payout): JsonResponse
    {
        $this->authorize('confirm', $payout);

        abort_unless($payout->status === SellerPayoutStatus::Paid, 422, 'This payout has not been marked as paid yet.');

        $payout->update([
            'status' => SellerPayoutStatus::Confirmed,
            'confirmed_at' => now(),
        ]);

        return (new SellerPayoutResource($payout->fresh('order')))->response();
    }
}
