<?php

namespace App\Events;

use App\Models\SellerSubscription;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionExpiring
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public SellerSubscription $subscription, public int $daysUntilExpiry = 7)
    {
    }
}
