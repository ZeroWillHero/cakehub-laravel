<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\SellerPayout;
use App\Models\User;

class SellerPayoutPolicy
{
    public function view(User $user, SellerPayout $payout): bool
    {
        return $user->role === UserRole::Admin || $user->seller?->id === $payout->seller_id;
    }

    public function confirm(User $user, SellerPayout $payout): bool
    {
        return $user->seller?->id === $payout->seller_id;
    }
}
