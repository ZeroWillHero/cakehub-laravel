<?php

namespace App\Policies;

use App\Models\Seller;
use App\Models\User;

class SellerPolicy
{
    public function update(User $user, Seller $seller): bool
    {
        return $user->id === $seller->user_id;
    }
}
