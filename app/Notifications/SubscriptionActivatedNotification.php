<?php

namespace App\Notifications;

use App\Models\SellerSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubscriptionActivatedNotification extends Notification
{
    use Queueable;

    public function __construct(public SellerSubscription $subscription)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = url('/seller/subscription');
        $plan = $this->subscription->subscriptionPlan;

        return (new MailMessage)
            ->subject("Subscription Activated — {$plan->name}")
            ->greeting("Your subscription is active!")
            ->line("Plan: {$plan->name}")
            ->line("Listing Limit: " . ($plan->listing_limit ?? 'Unlimited'))
            ->line("Expires: " . $this->subscription->ends_at->format('M d, Y'))
            ->action('View Subscription', $url)
            ->line('Thank you for subscribing to CakeHub!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'subscription_id' => $this->subscription->id,
            'plan_name' => $this->subscription->subscriptionPlan->name,
            'type' => 'subscription_activated',
            'message' => "Your {$this->subscription->subscriptionPlan->name} subscription is now active",
        ];
    }
}
