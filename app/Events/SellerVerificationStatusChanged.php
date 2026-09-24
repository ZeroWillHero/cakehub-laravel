<?php

namespace App\Events;

use App\Models\Seller;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SellerVerificationStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Seller $seller, public string $previousStatus)
    {
    }
}
