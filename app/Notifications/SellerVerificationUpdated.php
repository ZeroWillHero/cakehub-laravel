<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SellerVerificationUpdated extends Notification
{
    use Queueable;

    public function __construct(public string $subject, public string $message)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (! $notifiable instanceof User || $notifiable->wantsEmailFor('seller_verification')) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject)
            ->line($this->message)
            ->action('View store profile', url('/seller/profile'));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'subject' => $this->subject,
            'message' => $this->message,
        ];
    }
}
