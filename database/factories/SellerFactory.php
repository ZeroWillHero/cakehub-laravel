<?php

namespace Database\Factories;

use App\Enums\StoreStatus;
use App\Enums\VerificationStatus;
use App\Models\Seller;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use MatanYadaev\EloquentSpatial\Objects\Point;

/**
 * @extends Factory<Seller>
 */
class SellerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->seller(),
            'business_name' => fake()->company(),
            'slug' => fake()->unique()->slug(),
            'whatsapp_number' => '+1'.fake()->numerify('##########'),
            'location' => new Point(fake()->latitude(), fake()->longitude()),
            'store_status' => StoreStatus::Closed,
            'verification_status' => VerificationStatus::Pending,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn () => [
            'verification_status' => VerificationStatus::Verified,
            'verified_at' => now(),
        ]);
    }
}
