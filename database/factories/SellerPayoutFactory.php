<?php

namespace Database\Factories;

use App\Enums\SellerPayoutStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\SellerPayout;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SellerPayout>
 */
class SellerPayoutFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'seller_id' => Seller::factory(),
            'amount' => 25.00,
            'status' => SellerPayoutStatus::Pending,
        ];
    }
}
