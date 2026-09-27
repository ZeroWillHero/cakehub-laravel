<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification
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

        $subject = $this->recipientType === 'seller'
            ? "New Order #{$this->order->id} Received"
            : "Order Confirmation #{$this->order->id}";

        $greeting = $this->recipientType === 'seller'
            ? "A new order has been received!"
            : "Thank you for your order!";

        return (new MailMessage)
            ->subject($subject)
            ->greeting($greeting)
            ->line("Order ID: #{$this->order->id}")
            ->line("Total: " . number_format($this->order->total, 2))
            ->line("Items: {$this->order->items()->count()}")
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
            'type' => $this->recipientType,
            'total' => $this->order->total,
            'message' => $this->recipientType === 'seller'
                ? "New order #{$this->order->id} received"
                : "Your order #{$this->order->id} has been confirmed",
        ];
    }
}
