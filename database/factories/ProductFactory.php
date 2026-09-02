<?php

namespace Database\Factories;

use App\Enums\ProductAvailabilityStatus;
use App\Models\Product;
use App\Models\Seller;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'seller_id' => Seller::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'base_price' => fake()->randomFloat(2, 10, 100),
            'availability_status' => ProductAvailabilityStatus::InStock,
            'is_active' => true,
        ];
    }
}
