<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Notifications\OrderStatusUpdatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendOrderStatusUpdateNotifications implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order->load('customer', 'seller.user');

        // Notify customer
        if ($order->customer) {
            $order->customer->notify(new OrderStatusUpdatedNotification($order, 'customer'));
        }

        // Notify seller
        if ($order->seller?->user) {
            $order->seller->user->notify(new OrderStatusUpdatedNotification($order, 'seller'));
        }
    }
}
