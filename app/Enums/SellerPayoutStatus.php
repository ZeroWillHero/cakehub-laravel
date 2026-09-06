<?php

namespace App\Enums;

enum SellerPayoutStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Confirmed = 'confirmed';
}
