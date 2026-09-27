<?php

namespace App\Enums;

enum SellerSubscriptionStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
}
