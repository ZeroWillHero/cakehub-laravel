<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\SellerDocument;
use App\Models\User;

class SellerDocumentPolicy
{
    public function view(User $user, SellerDocument $document): bool
    {
        return $user->role === UserRole::Admin || $user->seller?->id === $document->seller_id;
    }
}
