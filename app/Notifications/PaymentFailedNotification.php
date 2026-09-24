<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentFailedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order, public string $reason = 'Payment processing failed')
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
        $retryUrl = url('/orders/' . $this->order->id . '/retry-payment');

        return (new MailMessage)
            ->subject("Payment Failed — Order #{$this->order->id}")
            ->greeting('Payment Issue')
            ->line("We were unable to process your payment for order #{$this->order->id}.")
            ->line("Reason: {$this->reason}")
            ->action('Retry Payment', $retryUrl)
            ->line('If you continue to have issues, please contact support.')
            ->line('Thank you for using CakeHub!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'type' => 'payment_failed',
            'reason' => $this->reason,
            'message' => "Payment failed for order #{$this->order->id}",
        ];
    }
}
