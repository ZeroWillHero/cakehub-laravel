<?php

namespace App\Listeners;

use App\Events\SubscriptionExpiring;
use App\Notifications\SubscriptionExpiryWarningNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendSubscriptionExpiryWarningNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionExpiring $event): void
    {
        $subscription = $event->subscription->load('seller.user', 'subscriptionPlan');

        if ($subscription->seller?->user) {
            $subscription->seller->user->notify(
                new SubscriptionExpiryWarningNotification($subscription, $event->daysUntilExpiry)
            );
        }
    }
}
