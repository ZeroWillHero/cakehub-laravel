<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'google_id' => fake()->unique()->numerify('###############'),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'avatar_url' => fake()->imageUrl(),
            'role' => null,
            'status' => UserStatus::Active,
        ];
    }

    public function customer(): static
    {
        return $this->state(fn () => ['role' => UserRole::Customer]);
    }

    public function seller(): static
    {
        return $this->state(fn () => ['role' => UserRole::Seller]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => UserRole::Admin]);
    }
}
