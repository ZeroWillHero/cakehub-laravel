<?php

use App\Enums\PaymentStatus;
use App\Enums\PaymentVerificationStatus;
use App\Enums\SellerSubscriptionStatus;
use App\Models\AdminBankAccount;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

it('lets a customer submit a payment slip for their own order', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->create(['customer_id' => $customer->id, 'payment_status' => PaymentStatus::Pending]);
    $bankAccount = AdminBankAccount::factory()->create();
    $file = UploadedFile::fake()->image('slip.jpg');

    $this->actingAs($customer)
        ->postJson('/api/payments', [
            'payable_type' => 'order',
            'payable_id' => $order->id,
            'amount' => (float) $order->total,
            'admin_bank_account_id' => $bankAccount->id,
            'slip' => $file,
        ])
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending_verification');

    expect($order->fresh()->payment_status)->toBe(PaymentStatus::AwaitingVerification);
    $payment = Payment::query()->first();
    Storage::disk('local')->assertExists($payment->slip_path);
});

it('rejects a payment slip in an unsupported file type', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->create(['customer_id' => $customer->id, 'payment_status' => PaymentStatus::Pending]);
    $bankAccount = AdminBankAccount::factory()->create();
    $file = UploadedFile::fake()->create('notes.txt', 10);

    $this->actingAs($customer)
        ->postJson('/api/payments', [
            'payable_type' => 'order',
            'payable_id' => $order->id,
            'amount' => (float) $order->total,
            'admin_bank_account_id' => $bankAccount->id,
            'slip' => $file,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['slip']);
});

it('forbids submitting a payment slip for another customer\'s order', function () {
    $customer = User::factory()->customer()->create();
    $other = User::factory()->customer()->create();
    $order = Order::factory()->create(['customer_id' => $other->id, 'payment_status' => PaymentStatus::Pending]);
    $bankAccount = AdminBankAccount::factory()->create();

    $this->actingAs($customer)
        ->postJson('/api/payments', [
            'payable_type' => 'order',
            'payable_id' => $order->id,
            'amount' => (float) $order->total,
            'admin_bank_account_id' => $bankAccount->id,
            'slip' => UploadedFile::fake()->image('slip.jpg'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['payable_id']);
});

it('lets a seller submit a payment slip for their own subscription', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $subscription = SellerSubscription::factory()->for($seller)->create(['status' => SellerSubscriptionStatus::Pending, 'starts_at' => null]);
    $bankAccount = AdminBankAccount::factory()->create();

    $this->actingAs($seller->user)
        ->postJson('/api/payments', [
            'payable_type' => 'subscription',
            'payable_id' => $subscription->id,
            'amount' => 10,
            'admin_bank_account_id' => $bankAccount->id,
            'slip' => UploadedFile::fake()->image('slip.jpg'),
        ])
        ->assertCreated();

    expect($subscription->fresh()->status)->toBe(SellerSubscriptionStatus::Pending);
});

it('forbids submitting a payment slip for another seller\'s subscription', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $otherSeller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $subscription = SellerSubscription::factory()->for($otherSeller, 'seller')->create(['status' => SellerSubscriptionStatus::Pending, 'starts_at' => null]);
    $bankAccount = AdminBankAccount::factory()->create();

    $this->actingAs($seller->user)
        ->postJson('/api/payments', [
            'payable_type' => 'subscription',
            'payable_id' => $subscription->id,
            'amount' => 10,
            'admin_bank_account_id' => $bankAccount->id,
            'slip' => UploadedFile::fake()->image('slip.jpg'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['payable_id']);
});

it('rejects a payment submission referencing a non-existent order/subscription', function () {
    $customer = User::factory()->customer()->create();
    $bankAccount = AdminBankAccount::factory()->create();

    $this->actingAs($customer)
        ->postJson('/api/payments', [
            'payable_type' => 'order',
            'payable_id' => 999999,
            'amount' => 10,
            'admin_bank_account_id' => $bankAccount->id,
            'slip' => UploadedFile::fake()->image('slip.jpg'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['payable_id']);
});

it('rejects a payment submission with a non-existent bank account', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->create(['customer_id' => $customer->id, 'payment_status' => PaymentStatus::Pending]);

    $this->actingAs($customer)
        ->postJson('/api/payments', [
            'payable_type' => 'order',
            'payable_id' => $order->id,
            'amount' => (float) $order->total,
            'admin_bank_account_id' => 999999,
            'slip' => UploadedFile::fake()->image('slip.jpg'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['admin_bank_account_id']);
});

it('rejects an unauthenticated payment submission', function () {
    $order = Order::factory()->create();
    $bankAccount = AdminBankAccount::factory()->create();

    $this->postJson('/api/payments', [
        'payable_type' => 'order',
        'payable_id' => $order->id,
        'amount' => (float) $order->total,
        'admin_bank_account_id' => $bankAccount->id,
        'slip' => UploadedFile::fake()->image('slip.jpg'),
    ])->assertUnauthorized();
});

it('rejects an unauthenticated request to view a payment slip', function () {
    $order = Order::factory()->create();
    $payment = Payment::factory()->create([
        'payable_type' => Order::class,
        'payable_id' => $order->id,
    ]);

    $this->getJson("/api/payments/{$payment->id}")->assertUnauthorized();
});

it('returns 404 when viewing a payment that does not exist', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)->getJson('/api/payments/999999')->assertNotFound();
});

it('lets the submitting customer and an admin view the slip, but not a stranger', function () {
    $customer = User::factory()->customer()->create();
    $stranger = User::factory()->customer()->create();
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['customer_id' => $customer->id]);
    Storage::disk('local')->put('payment_slips/1/slip.jpg', 'fake-content');
    $payment = Payment::factory()->create([
        'payable_type' => Order::class,
        'payable_id' => $order->id,
        'submitted_by' => $customer->id,
        'slip_path' => 'payment_slips/1/slip.jpg',
    ]);

    $this->actingAs($customer)->getJson("/api/payments/{$payment->id}")->assertOk();
    $this->actingAs($admin)->getJson("/api/payments/{$payment->id}")->assertOk();
    $this->actingAs($stranger)->getJson("/api/payments/{$payment->id}")->assertForbidden();
});

it('lets an admin verify a pending payment, marking the order paid', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['payment_status' => PaymentStatus::AwaitingVerification]);
    $payment = Payment::factory()->create([
        'payable_type' => Order::class,
        'payable_id' => $order->id,
        'status' => PaymentVerificationStatus::PendingVerification,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/payments/{$payment->id}/verify")
        ->assertOk()
        ->assertJsonPath('data.status', 'verified');

    expect($order->fresh()->payment_status)->toBe(PaymentStatus::Paid);
    expect($payment->fresh()->verified_by)->toBe($admin->id);
});

it('lets an admin verify a pending subscription payment, activating the subscription', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $subscription = SellerSubscription::factory()->for($seller)->create(['status' => SellerSubscriptionStatus::Pending, 'starts_at' => null]);
    $payment = Payment::factory()->create([
        'payable_type' => SellerSubscription::class,
        'payable_id' => $subscription->id,
        'status' => PaymentVerificationStatus::PendingVerification,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/payments/{$payment->id}/verify")
        ->assertOk();

    expect($subscription->fresh()->status)->toBe(SellerSubscriptionStatus::Active);
    expect($subscription->fresh()->starts_at)->not->toBeNull();
});

it('cancels the previous active subscription and hides excess listings when a downgrade payment is verified', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $bigPlan = SubscriptionPlan::factory()->create(['listing_limit' => 10]);
    $oldSubscription = SellerSubscription::factory()->for($seller)->for($bigPlan, 'subscriptionPlan')->create();
    Product::factory()->count(3)->for($seller)->create(['is_active' => true]);
    $smallPlan = SubscriptionPlan::factory()->create(['listing_limit' => 1]);
    $newSubscription = SellerSubscription::factory()->for($seller)->for($smallPlan, 'subscriptionPlan')
        ->create(['status' => SellerSubscriptionStatus::Pending, 'starts_at' => null]);
    $payment = Payment::factory()->create([
        'payable_type' => SellerSubscription::class,
        'payable_id' => $newSubscription->id,
        'status' => PaymentVerificationStatus::PendingVerification,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/payments/{$payment->id}/verify")
        ->assertOk();

    expect($oldSubscription->fresh()->status)->toBe(SellerSubscriptionStatus::Cancelled);
    expect($newSubscription->fresh()->status)->toBe(SellerSubscriptionStatus::Active);
    expect($seller->products()->where('is_active', true)->count())->toBe(1);
    expect($seller->products()->count())->toBe(3);
});

it('lets an admin reject a payment with a reason, leaving the order unpaid', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['payment_status' => PaymentStatus::AwaitingVerification]);
    $payment = Payment::factory()->create([
        'payable_type' => Order::class,
        'payable_id' => $order->id,
        'status' => PaymentVerificationStatus::PendingVerification,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/payments/{$payment->id}/reject", ['rejection_reason' => 'Slip does not match reference.'])
        ->assertOk()
        ->assertJsonPath('data.status', 'rejected');

    expect($order->fresh()->payment_status)->toBe(PaymentStatus::AwaitingVerification);
    expect($payment->fresh()->rejection_reason)->toBe('Slip does not match reference.');
});

it('requires a rejection reason', function () {
    $admin = User::factory()->admin()->create();
    $payment = Payment::factory()->create();

    $this->actingAs($admin)
        ->postJson("/api/admin/payments/{$payment->id}/reject", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rejection_reason']);
});

it('forbids a non-admin from verifying a payment', function () {
    $customer = User::factory()->customer()->create();
    $payment = Payment::factory()->create();

    $this->actingAs($customer)
        ->postJson("/api/admin/payments/{$payment->id}/verify")
        ->assertForbidden();
});

it('forbids a non-admin from rejecting a payment', function () {
    $customer = User::factory()->customer()->create();
    $payment = Payment::factory()->create();

    $this->actingAs($customer)
        ->postJson("/api/admin/payments/{$payment->id}/reject", ['rejection_reason' => 'Not valid.'])
        ->assertForbidden();
});

it('returns 404 when verifying a payment that does not exist', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/payments/999999/verify')
        ->assertNotFound();
});

it('returns 404 when rejecting a payment that does not exist', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/payments/999999/reject', ['rejection_reason' => 'Not valid.'])
        ->assertNotFound();
});

it('remains idempotent when an admin re-verifies an already-verified order payment', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['payment_status' => PaymentStatus::Paid]);
    $payment = Payment::factory()->create([
        'payable_type' => Order::class,
        'payable_id' => $order->id,
        'status' => PaymentVerificationStatus::Verified,
        'verified_by' => $admin->id,
        'verified_at' => now()->subDay(),
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/payments/{$payment->id}/verify")
        ->assertOk()
        ->assertJsonPath('data.status', 'verified');

    expect($order->fresh()->payment_status)->toBe(PaymentStatus::Paid);
});
