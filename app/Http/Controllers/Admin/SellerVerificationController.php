<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectSellerRequest;
use App\Http\Requests\Admin\RequestSellerInfoRequest;
use App\Http\Resources\SellerResource;
use App\Models\Seller;
use App\Notifications\SellerVerificationUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SellerVerificationController extends Controller
{
    public function pending(): Response
    {
        $sellers = Seller::query()
            ->where('verification_status', VerificationStatus::Pending)
            ->with('documents')
            ->latest()
            ->get();

        return Inertia::render('Admin/VerificationQueue', [
            'sellers' => SellerResource::collection($sellers)->resolve(),
        ]);
    }

    public function show(Seller $seller): Response
    {
        return Inertia::render('Admin/SellerDetail', [
            'seller' => (new SellerResource($seller->load(['documents', 'user'])))->resolve(),
        ]);
    }

    public function verify(Request $request, Seller $seller): JsonResponse
    {
        $seller->applyVerification(VerificationStatus::Verified, $request->user()->id);

        $seller->user->notify(new SellerVerificationUpdated(
            'Your store is verified',
            'Congratulations — your CakeHub store has been verified and now shows the verified badge.',
        ));

        return (new SellerResource($seller->load(['documents', 'user'])))->response();
    }

    public function reject(RejectSellerRequest $request, Seller $seller): JsonResponse
    {
        $seller->applyVerification(VerificationStatus::Rejected, $request->user()->id);

        $seller->user->notify(new SellerVerificationUpdated(
            'Your verification was rejected',
            $request->validated('reason'),
        ));

        return (new SellerResource($seller->load(['documents', 'user'])))->response();
    }

    public function requestInfo(RequestSellerInfoRequest $request, Seller $seller): JsonResponse
    {
        $seller->user->notify(new SellerVerificationUpdated(
            'More information needed to verify your store',
            $request->validated('message'),
        ));

        return (new SellerResource($seller->load(['documents', 'user'])))->response();
    }

    public function suspend(Request $request, Seller $seller): JsonResponse
    {
        $seller->applyVerification(VerificationStatus::Suspended);

        $seller->user->notify(new SellerVerificationUpdated(
            'Your store has been suspended',
            'Your CakeHub store has been suspended by an administrator. Contact support for details.',
        ));

        return (new SellerResource($seller->load(['documents', 'user'])))->response();
    }
}
