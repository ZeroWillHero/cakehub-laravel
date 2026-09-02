<?php

namespace Database\Factories;

use App\Enums\SellerSubscriptionStatus;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SellerSubscription>
 */
class SellerSubscriptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'seller_id' => Seller::factory(),
            'subscription_plan_id' => SubscriptionPlan::factory(),
            'status' => SellerSubscriptionStatus::Active,
            'starts_at' => now(),
        ];
    }
}
