<?php

namespace App\Listeners;

use App\Events\PaymentFailed;
use App\Notifications\PaymentFailedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendPaymentFailedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentFailed $event): void
    {
        $order = $event->order->load('customer');

        if ($order->customer) {
            $order->customer->notify(new PaymentFailedNotification($order, $event->reason));
        }
    }
}
