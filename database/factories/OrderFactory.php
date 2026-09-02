<?php

namespace Database\Factories;

use App\Enums\DeliveryType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id' => User::factory()->customer(),
            'seller_id' => Seller::factory(),
            'status' => OrderStatus::Placed,
            'delivery_type' => DeliveryType::Pickup,
            'scheduled_at' => now()->addDay(),
            'subtotal' => 25.00,
            'delivery_fee' => 0,
            'total' => 25.00,
            'payment_status' => PaymentStatus::Paid,
        ];
    }
}
