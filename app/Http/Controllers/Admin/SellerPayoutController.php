<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SellerPayoutStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MarkSellerPayoutPaidRequest;
use App\Http\Resources\SellerPayoutResource;
use App\Models\SellerPayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SellerPayoutController extends Controller
{
    public function index(Request $request): Response
    {
        $payouts = SellerPayout::query()
            ->with(['seller', 'order'])
            ->latest()
            ->get();

        return Inertia::render('Admin/SellerPayouts', [
            'payouts' => SellerPayoutResource::collection($payouts)->resolve(),
        ]);
    }

    public function markPaid(MarkSellerPayoutPaidRequest $request, SellerPayout $payout): JsonResponse
    {
        $path = $request->file('slip')->store('seller_payout_slips/'.$payout->seller_id, 'local');

        $payout->update([
            'slip_path' => $path,
            'status' => SellerPayoutStatus::Paid,
            'paid_by' => $request->user()->id,
            'paid_at' => now(),
        ]);

        return (new SellerPayoutResource($payout->fresh(['seller', 'order'])))->response();
    }
}
