<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubscriptionStatusUpdated extends Notification
{
    use Queueable;

    public function __construct(public string $subjectLine, public string $message)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (! $notifiable instanceof User || $notifiable->wantsEmailFor('subscription_status')) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subjectLine)
            ->line($this->message)
            ->action('View subscription', url('/seller/subscription'));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'subject' => $this->subjectLine,
            'message' => $this->message,
        ];
    }
}
