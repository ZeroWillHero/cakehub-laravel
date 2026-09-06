<?php

namespace Database\Factories;

use App\Models\AdminBankAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AdminBankAccount>
 */
class AdminBankAccountFactory extends Factory
{
    public function definition(): array
    {
        return [
            'bank_name' => fake()->company().' Bank',
            'account_name' => 'CakeHub Ltd',
            'account_number' => fake()->numerify('##########'),
            'branch' => fake()->city(),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
