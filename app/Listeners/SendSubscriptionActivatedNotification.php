<?php

namespace App\Listeners;

use App\Events\SubscriptionActivated;
use App\Notifications\SubscriptionActivatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendSubscriptionActivatedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionActivated $event): void
    {
        $subscription = $event->subscription->load('seller.user', 'subscriptionPlan');

        if ($subscription->seller?->user) {
            $subscription->seller->user->notify(new SubscriptionActivatedNotification($subscription));
        }
    }
}
