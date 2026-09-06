<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\PaymentVerificationStatus;
use App\Models\AdminBankAccount;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'payable_type' => Order::class,
            'payable_id' => Order::factory(),
            'method' => PaymentMethod::BankTransfer,
            'amount' => 25.00,
            'admin_bank_account_id' => AdminBankAccount::factory(),
            'slip_path' => 'payment_slips/1/slip.jpg',
            'status' => PaymentVerificationStatus::PendingVerification,
            'submitted_by' => User::factory()->customer(),
        ];
    }
}
