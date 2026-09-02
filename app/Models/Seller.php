<?php

namespace App\Models;

use App\Enums\SellerSubscriptionStatus;
use App\Enums\StoreStatus;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Traits\HasSpatial;

#[Fillable([
    'user_id', 'business_name', 'slug', 'description', 'logo_path', 'cover_path',
    'whatsapp_number', 'location', 'address_line', 'operating_hours', 'store_status',
])]
class Seller extends Model
{
    use HasFactory, HasSpatial;

    protected function casts(): array
    {
        return [
            'location' => Point::class,
            'operating_hours' => 'array',
            'store_status' => StoreStatus::class,
            'verification_status' => VerificationStatus::class,
            'verified_at' => 'datetime',
            'average_rating' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(SellerSubscription::class);
    }

    public function activeSubscription(): ?SellerSubscription
    {
        return $this->subscriptions()
            ->where('status', SellerSubscriptionStatus::Active)
            ->latest('starts_at')
            ->with('subscriptionPlan')
            ->first();
    }

    /**
     * The seller's current listing limit: from their active subscription's
     * plan, or the platform's default Free plan (price = 0) if they've
     * never subscribed. Null means unlimited. Never hard-code the number
     * here — it always comes from subscription_plans (admin-editable,
     * see docs/requirements.md §3.9.1).
     */
    public function listingLimit(): ?int
    {
        $plan = $this->activeSubscription()?->subscriptionPlan
            ?? SubscriptionPlan::query()->where('price', 0)->where('is_active', true)->first();

        return $plan?->listing_limit;
    }

    /**
     * Every listing counts against the limit, active or inactive
     * (soft-unpublishing shouldn't be a way to bypass the limit).
     */
    public function listingUsage(): int
    {
        return $this->products()->count();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(SellerDocument::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function recalculateAverageRating(): void
    {
        $this->average_rating = $this->reviews()->avg('rating') ?? 0;
        $this->save();
    }

    /**
     * verification_status/verified_by/verified_at are intentionally not
     * mass-assignable (only admins should ever set them) — set directly.
     */
    public function applyVerification(VerificationStatus $status, ?int $verifiedBy = null): void
    {
        $this->verification_status = $status;
        if ($verifiedBy !== null) {
            $this->verified_by = $verifiedBy;
            $this->verified_at = now();
        }
        $this->save();
    }

    /**
     * Called after a subscription downgrade/lapse: if the seller now has
     * more customer-visible listings than their new (lower) limit allows,
     * hide the excess (is_active = false) rather than delete them — the
     * seller can pick which stay visible, or re-activate on resubscribing.
     * Most-recently-created listings are hidden first.
     */
    public function hideExcessListings(): void
    {
        $limit = $this->listingLimit();
        if ($limit === null) {
            return;
        }

        $activeProducts = $this->products()->where('is_active', true)->latest()->get();
        $excess = $activeProducts->count() - $limit;
        if ($excess <= 0) {
            return;
        }

        $activeProducts->take($excess)->each(fn (Product $product) => $product->update(['is_active' => false]));
    }
}
