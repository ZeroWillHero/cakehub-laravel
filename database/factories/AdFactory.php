<?php

namespace Database\Factories;

use App\Enums\AdStatus;
use App\Models\Ad;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ad>
 */
class AdFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => ucfirst(fake()->words(3, true)),
            'description' => fake()->sentence(),
            'image_path' => null,
            'paid_amount' => fake()->randomFloat(2, 10, 500),
            'status' => AdStatus::Active,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(7),
            'sort_order' => 0,
            'created_by' => null,
        ];
    }
}
