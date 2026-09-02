<?php

namespace App\Console\Commands;

use App\Enums\SellerSubscriptionStatus;
use App\Models\SellerSubscription;
use App\Notifications\SubscriptionStatusUpdated;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:expire-seller-subscriptions')]
#[Description('Expires seller subscriptions past their ends_at and hides listings over the new (lower) limit')]
class ExpireSellerSubscriptions extends Command
{
    public function handle(): void
    {
        $lapsed = SellerSubscription::query()
            ->where('status', SellerSubscriptionStatus::Active)
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now())
            ->with(['seller.user', 'subscriptionPlan'])
            ->get();

        foreach ($lapsed as $subscription) {
            $subscription->update(['status' => SellerSubscriptionStatus::Expired]);

            $seller = $subscription->seller;
            $seller->hideExcessListings();

            $seller->user->notify(new SubscriptionStatusUpdated(
                'Your subscription has expired',
                "Your {$subscription->subscriptionPlan->name} subscription has expired. You've been moved to the Free plan's listing limit.",
            ));
        }

        $this->info("Expired {$lapsed->count()} subscription(s).");
    }
}
