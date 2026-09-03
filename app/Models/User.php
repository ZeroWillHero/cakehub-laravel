<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['google_id', 'name', 'email', 'avatar_url', 'role', 'status', 'notification_preferences'])]
#[Hidden(['remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'notification_preferences' => 'array',
        ];
    }

    /**
     * Per-type email opt-out (docs/plan-settings-avatars-product-reviews.md
     * §2.1). In-app (database) notifications always fire regardless — this
     * only gates the 'mail' channel. Unset/null preferences default to on.
     */
    public function wantsEmailFor(string $type): bool
    {
        return $this->notification_preferences[$type]['email'] ?? true;
    }

    public function customerProfile(): HasOne
    {
        return $this->hasOne(CustomerProfile::class);
    }

    public function seller(): HasOne
    {
        return $this->hasOne(Seller::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }
}
