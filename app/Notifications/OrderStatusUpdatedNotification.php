<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order, public string $recipientType = 'customer')
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
        $url = $this->recipientType === 'seller'
            ? url('/seller/orders/' . $this->order->id)
            : url('/orders/' . $this->order->id);

        $statusLabel = ucfirst($this->order->status->value);

        return (new MailMessage)
            ->subject("Order #{$this->order->id} — Status Update: {$statusLabel}")
            ->line("Order #{$this->order->id} is now: {$statusLabel}")
            ->action('View Order', $url)
            ->line('Thank you for using CakeHub!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'status' => $this->order->status->value,
            'type' => $this->recipientType,
            'message' => "Order #{$this->order->id} is now {$this->order->status->value}",
        ];
    }
}
