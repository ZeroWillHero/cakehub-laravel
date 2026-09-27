<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus as OrderPaymentStatus;
use App\Enums\PaymentVerificationStatus;
use App\Enums\SellerSubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SubmitPaymentSlipRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SellerSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentController extends Controller
{
    public function store(SubmitPaymentSlipRequest $request): JsonResponse
    {
        $payable = $request->resolvePayable();
        $user = $request->user();

        $path = $request->file('slip')->store('payment_slips/'.$user->id, 'local');

        $payment = DB::transaction(function () use ($request, $payable, $user, $path) {
            $payment = Payment::query()->create([
                'payable_type' => $payable::class,
                'payable_id' => $payable->id,
                'method' => PaymentMethod::BankTransfer,
                'amount' => $request->validated('amount'),
                'admin_bank_account_id' => $request->validated('admin_bank_account_id'),
                'slip_path' => $path,
                'status' => PaymentVerificationStatus::PendingVerification,
                'submitted_by' => $user->id,
            ]);

            if ($payable instanceof Order) {
                $update = ['payment_status' => OrderPaymentStatus::AwaitingVerification];
                if ($request->filled('reference')) {
                    $update['payment_reference'] = $request->validated('reference');
                }
                $payable->update($update);
            } elseif ($payable instanceof SellerSubscription) {
                $payable->update(['status' => SellerSubscriptionStatus::Pending]);
            }

            return $payment;
        });

        return (new PaymentResource($payment->load(['adminBankAccount', 'submittedBy'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Payment $payment): StreamedResponse
    {
        $this->authorize('view', $payment);

        return Storage::disk('local')->response($payment->slip_path);
    }
}
