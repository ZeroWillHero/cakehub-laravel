<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'email_order_status',
    'email_payment_failed',
    'email_subscription_expiry',
    'email_promotions',
    'push_order_status',
    'push_payment_failed',
])]
class UserNotificationPreference extends Model
{
    protected function casts(): array
    {
        return [
            'email_order_status' => 'boolean',
            'email_payment_failed' => 'boolean',
            'email_subscription_expiry' => 'boolean',
            'email_promotions' => 'boolean',
            'push_order_status' => 'boolean',
            'push_payment_failed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
