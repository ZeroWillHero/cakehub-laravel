<?php

namespace App\Providers;

use App\Events\OrderPlaced;
use App\Events\OrderStatusChanged;
use App\Events\PaymentFailed;
use App\Events\SellerVerificationStatusChanged;
use App\Events\SubscriptionActivated;
use App\Events\SubscriptionExpiring;
use App\Listeners\SendOrderPlacedNotifications;
use App\Listeners\SendOrderStatusUpdateNotifications;
use App\Listeners\SendPaymentFailedNotification;
use App\Listeners\SendSellerVerificationStatusNotification;
use App\Listeners\SendSubscriptionActivatedNotification;
use App\Listeners\SendSubscriptionExpiryWarningNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        OrderPlaced::class => [
            SendOrderPlacedNotifications::class,
        ],
        OrderStatusChanged::class => [
            SendOrderStatusUpdateNotifications::class,
        ],
        PaymentFailed::class => [
            SendPaymentFailedNotification::class,
        ],
        SellerVerificationStatusChanged::class => [
            SendSellerVerificationStatusNotification::class,
        ],
        SubscriptionActivated::class => [
            SendSubscriptionActivatedNotification::class,
        ],
        SubscriptionExpiring::class => [
            SendSubscriptionExpiryWarningNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }
}
