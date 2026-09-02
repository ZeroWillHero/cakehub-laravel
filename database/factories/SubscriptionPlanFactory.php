<?php

namespace Database\Factories;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubscriptionPlan>
 */
class SubscriptionPlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Free',
            'price' => 0,
            'billing_cycle' => null,
            'listing_limit' => 5,
            'features' => [],
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
