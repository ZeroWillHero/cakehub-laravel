<?php

namespace App\Events;

use App\Models\SellerSubscription;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionActivated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public SellerSubscription $subscription)
    {
    }
}
