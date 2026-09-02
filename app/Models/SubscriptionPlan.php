<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'price', 'billing_cycle', 'listing_limit', 'features', 'is_active', 'sort_order'])]
class SubscriptionPlan extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'features' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function sellerSubscriptions(): HasMany
    {
        return $this->hasMany(SellerSubscription::class);
    }
}
