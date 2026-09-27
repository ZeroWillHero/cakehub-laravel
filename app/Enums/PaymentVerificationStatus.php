<?php

namespace App\Enums;

enum PaymentVerificationStatus: string
{
    case PendingVerification = 'pending_verification';
    case Verified = 'verified';
    case Rejected = 'rejected';
}
