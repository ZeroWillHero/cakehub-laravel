<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentStatus as OrderPaymentStatus;
use App\Enums\PaymentVerificationStatus;
use App\Enums\SellerSubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SellerSubscription;
use App\Notifications\SubscriptionStatusUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentVerificationController extends Controller
{
    public function index(Request $request): Response
    {
        $payments = Payment::query()
            ->where('status', PaymentVerificationStatus::PendingVerification)
            ->with(['payable', 'submittedBy', 'adminBankAccount'])
            ->latest()
            ->get();

        return Inertia::render('Admin/PaymentVerifications', [
            'payments' => PaymentResource::collection($payments)->resolve(),
        ]);
    }

    public function verify(Payment $payment): JsonResponse
    {
        DB::transaction(function () use ($payment) {
            $payment->update([
                'status' => PaymentVerificationStatus::Verified,
                'verified_by' => auth()->id(),
                'verified_at' => now(),
            ]);

            $payable = $payment->payable;

            if ($payable instanceof Order) {
                $payable->update(['payment_status' => OrderPaymentStatus::Paid]);
            } elseif ($payable instanceof SellerSubscription) {
                $seller = $payable->seller;

                $seller->subscriptions()
                    ->where('id', '!=', $payable->id)
                    ->where('status', SellerSubscriptionStatus::Active)
                    ->update(['status' => SellerSubscriptionStatus::Cancelled, 'ends_at' => now()]);

                $plan = $payable->subscriptionPlan;
                $previousLimit = $seller->listingLimit();
                $endsAt = match ($plan->billing_cycle) {
                    'monthly' => now()->addMonth(),
                    'annual' => now()->addYear(),
                    default => null,
                };

                $payable->update([
                    'status' => SellerSubscriptionStatus::Active,
                    'starts_at' => now(),
                    'ends_at' => $endsAt,
                ]);

                if ($plan->listing_limit !== null && ($previousLimit === null || $plan->listing_limit < $previousLimit)) {
                    $seller->hideExcessListings();
                }

                $seller->user->notify(new SubscriptionStatusUpdated(
                    'Your subscription is now '.$plan->name,
                    "Your payment was verified — you're now subscribed to the {$plan->name} plan.",
                ));
            }
        });

        return (new PaymentResource($payment->fresh(['payable', 'submittedBy', 'adminBankAccount'])))->response();
    }

    public function reject(RejectPaymentRequest $request, Payment $payment): JsonResponse
    {
        $payment->update([
            'status' => PaymentVerificationStatus::Rejected,
            'verified_by' => auth()->id(),
            'verified_at' => now(),
            'rejection_reason' => $request->validated('rejection_reason'),
        ]);

        return (new PaymentResource($payment->fresh(['payable', 'submittedBy', 'adminBankAccount'])))->response();
    }
}
