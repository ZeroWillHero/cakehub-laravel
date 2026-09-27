<?php

namespace App\Notifications;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusUpdated extends Notification
{
    use Queueable;

    public function __construct(public Order $order)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (! $notifiable instanceof User || $notifiable->wantsEmailFor('order_status')) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = $notifiable instanceof User && $notifiable->role === UserRole::Seller
            ? url('/seller/orders')
            : url("/orders/{$this->order->id}");

        return (new MailMessage)
            ->subject("Order #{$this->order->id} — {$this->order->status->value}")
            ->line("Order #{$this->order->id} is now: {$this->order->status->value}.")
            ->action('View order', $url);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'status' => $this->order->status->value,
            'message' => "Order #{$this->order->id} is now {$this->order->status->value}.",
        ];
    }
}
