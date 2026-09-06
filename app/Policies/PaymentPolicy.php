<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function view(User $user, Payment $payment): bool
    {
        if ($user->role === UserRole::Admin || $user->id === $payment->submitted_by) {
            return true;
        }

        $payable = $payment->payable;

        if ($payable instanceof Order) {
            return $user->id === $payable->customer_id || $user->seller?->id === $payable->seller_id;
        }

        return $user->seller?->id === $payable?->seller_id;
    }
}
