<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

/**
 * Seed/default data only — draft pricing from docs/requirements.md §3.9.1.
 * Fully admin-editable via the Phase 7 admin panel; never hard-code these
 * values in application logic (see docs/requirements.md §3.9.1 and
 * docs/skills/backend-testing-skill.md).
 */
class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            ['name' => 'Free', 'price' => 0, 'billing_cycle' => null, 'listing_limit' => 5, 'sort_order' => 0, 'features' => []],
            ['name' => 'Basic', 'price' => 9, 'billing_cycle' => 'monthly', 'listing_limit' => 20, 'sort_order' => 1, 'features' => []],
            ['name' => 'Pro', 'price' => 19, 'billing_cycle' => 'monthly', 'listing_limit' => 50, 'sort_order' => 2, 'features' => ['basic_analytics' => true]],
            ['name' => 'Premium', 'price' => 39, 'billing_cycle' => 'monthly', 'listing_limit' => null, 'sort_order' => 3, 'features' => ['basic_analytics' => true, 'advanced_analytics' => true]],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::query()->updateOrCreate(
                ['name' => $plan['name']],
                [...$plan, 'is_active' => true],
            );
        }
    }
}
