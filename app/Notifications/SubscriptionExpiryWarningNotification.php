<?php

namespace App\Notifications;

use App\Models\SellerSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubscriptionExpiryWarningNotification extends Notification
{
    use Queueable;

    public function __construct(public SellerSubscription $subscription, public int $daysUntilExpiry = 7)
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
        $renewUrl = url('/seller/subscription/renew');
        $plan = $this->subscription->subscriptionPlan;

        return (new MailMessage)
            ->subject("Subscription Expiring Soon — {$plan->name}")
            ->greeting('Subscription Expiration Notice')
            ->line("Your {$plan->name} subscription will expire in {$this->daysUntilExpiry} days.")
            ->line("Expiration Date: " . $this->subscription->ends_at->format('M d, Y'))
            ->action('Renew Subscription', $renewUrl)
            ->line('Continue selling on CakeHub by renewing your subscription.')
            ->line('Thank you for using CakeHub!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'subscription_id' => $this->subscription->id,
            'plan_name' => $this->subscription->subscriptionPlan->name,
            'days_until_expiry' => $this->daysUntilExpiry,
            'type' => 'subscription_expiry_warning',
            'message' => "Your subscription expires in {$this->daysUntilExpiry} days",
        ];
    }
}
