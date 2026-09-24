<?php

namespace App\Listeners;

use App\Events\SellerVerificationStatusChanged;
use App\Notifications\SellerVerificationUpdatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendSellerVerificationStatusNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SellerVerificationStatusChanged $event): void
    {
        $seller = $event->seller->load('user');

        if ($seller->user) {
            $seller->user->notify(new SellerVerificationUpdatedNotification($seller));
        }
    }
}
