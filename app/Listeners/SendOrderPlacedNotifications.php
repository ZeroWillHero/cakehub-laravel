<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendOrderPlacedNotifications implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(OrderPlaced $event): void
    {
        $order = $event->order->load('customer', 'seller.user');

        // Notify customer
        if ($order->customer) {
            $order->customer->notify(new OrderPlacedNotification($order, 'customer'));
        }

        // Notify seller
        if ($order->seller?->user) {
            $order->seller->user->notify(new OrderPlacedNotification($order, 'seller'));
        }
    }
}
