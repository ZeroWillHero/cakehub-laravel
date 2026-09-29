<?php

namespace Database\Seeders;

use App\Enums\DocumentStatus;
use App\Enums\DocumentType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentVerificationStatus;
use App\Enums\SellerPayoutStatus;
use App\Enums\SellerSubscriptionStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\Address;
use App\Models\Ad;
use App\Models\AdminBankAccount;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Review;
use App\Models\Seller;
use App\Models\SellerDocument;
use App\Models\SellerPayout;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use MatanYadaev\EloquentSpatial\Objects\Point;

/**
 * Phase 9 audit fixtures — NOT wired into DatabaseSeeder. Run explicitly:
 *   php artisan db:seed --class=AuditTestDataSeeder
 *
 * Creates one of every role/state combination called for in the Phase 9
 * cross-cutting audit brief so every Customer/Seller/Admin screen has real
 * data to render against. Additive/idempotent-ish (guards on unique slugs
 * /emails) so it's safe to re-run, but it is still test data — not meant
 * for any environment but the confirmed dev/test Supabase project.
 */
class AuditTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $freePlan = SubscriptionPlan::query()->where('price', 0)->where('is_active', true)->firstOrFail();
        $paidPlan = SubscriptionPlan::query()->where('name', 'Pro')->firstOrFail();
        $categories = Category::query()->pluck('id', 'slug');
        $bankAccount = $this->bankAccounts();

        // ---- Admin -----------------------------------------------------
        User::query()->updateOrCreate(
            ['email' => 'audit.admin@cakehub.test'],
            [
                'google_id' => 'audit-admin-google-id',
                'name' => 'Audit Admin',
                'role' => UserRole::Admin,
                'status' => UserStatus::Active,
            ],
        );

        // ---- Customers ---------------------------------------------------
        $customerWithHistory = $this->makeCustomer('audit.customer.history@cakehub.test', 'Priya History');
        $customerWithCart = $this->makeCustomer('audit.customer.cart@cakehub.test', 'Kasun Cart');
        $customerFresh = $this->makeCustomer('audit.customer.fresh@cakehub.test', 'Nadia Fresh');

        // ---- Sellers, one per required verification/subscription state --
        $sellerPending = $this->makeSeller(
            email: 'audit.seller.pending@cakehub.test',
            business: 'Pending Petals Bakery',
            verification: VerificationStatus::Pending,
            storeStatus: StoreStatus::Closed,
        );

        $sellerFree = $this->makeSeller(
            email: 'audit.seller.free@cakehub.test',
            business: 'Free Tier Treats',
            verification: VerificationStatus::Verified,
            storeStatus: StoreStatus::Open,
        );

        $sellerActive = $this->makeSeller(
            email: 'audit.seller.active@cakehub.test',
            business: 'Active Subscription Sweets',
            verification: VerificationStatus::Verified,
            storeStatus: StoreStatus::Open,
        );
        SellerSubscription::query()->updateOrCreate(
            ['seller_id' => $sellerActive->id, 'subscription_plan_id' => $paidPlan->id, 'status' => SellerSubscriptionStatus::Active],
            ['starts_at' => now()->subDays(10), 'ends_at' => now()->addDays(20)],
        );

        $sellerExpired = $this->makeSeller(
            email: 'audit.seller.expired@cakehub.test',
            business: 'Expired Plan Confections',
            verification: VerificationStatus::Verified,
            storeStatus: StoreStatus::Open,
        );
        SellerSubscription::query()->updateOrCreate(
            ['seller_id' => $sellerExpired->id, 'subscription_plan_id' => $paidPlan->id, 'status' => SellerSubscriptionStatus::Expired],
            ['starts_at' => now()->subDays(60), 'ends_at' => now()->subDays(30)],
        );

        $sellerRejected = $this->makeSeller(
            email: 'audit.seller.rejected@cakehub.test',
            business: 'Rejected Requests Cakery',
            verification: VerificationStatus::Rejected,
            storeStatus: StoreStatus::Closed,
        );

        // Note: SellerSubscriptionStatus has no "grace_period" case in
        // app/Enums/SellerSubscriptionStatus.php (only pending/active/
        // cancelled/expired) — see open questions in the audit report;
        // "Expired" above stands in for the grace-period state requested.

        // ---- Seller documents (approve/reject queue) --------------------
        SellerDocument::query()->firstOrCreate(
            ['seller_id' => $sellerPending->id, 'type' => DocumentType::BusinessRegistration],
            ['file_path' => 'seller_documents/audit/business-reg.pdf', 'status' => DocumentStatus::Pending],
        );
        SellerDocument::query()->firstOrCreate(
            ['seller_id' => $sellerRejected->id, 'type' => DocumentType::FoodSafetyCert],
            ['file_path' => 'seller_documents/audit/food-safety.pdf', 'status' => DocumentStatus::Rejected, 'rejection_reason' => 'Certificate expired.'],
        );

        // ---- Products per verified seller --------------------------------
        $productsFree = $this->makeProducts($sellerFree, $categories, 'Free Tier');
        $productsActive = $this->makeProducts($sellerActive, $categories, 'Active Sub');
        $productsExpired = $this->makeProducts($sellerExpired, $categories, 'Expired Sub');

        // ---- Orders spanning every OrderStatus ----------------------------
        $statuses = OrderStatus::cases();
        $sellersForOrders = [$sellerFree, $sellerActive, $sellerExpired];
        $customersForOrders = [$customerWithHistory, $customerFresh];

        foreach ($statuses as $i => $status) {
            $seller = $sellersForOrders[$i % count($sellersForOrders)];
            $products = $seller->is($sellerFree) ? $productsFree : ($seller->is($sellerActive) ? $productsActive : $productsExpired);
            $customer = $customersForOrders[$i % count($customersForOrders)];
            $product = $products[$i % count($products)];

            $paymentStatus = match ($status) {
                OrderStatus::Placed => PaymentStatus::AwaitingVerification,
                OrderStatus::Cancelled => PaymentStatus::Refunded,
                default => PaymentStatus::Paid,
            };

            $order = Order::query()->firstOrCreate(
                [
                    'customer_id' => $customer->id,
                    'seller_id' => $seller->id,
                    'status' => $status,
                ],
                [
                    'delivery_type' => 'pickup',
                    'scheduled_at' => now()->addDays(1 + $i),
                    'subtotal' => (float) $product->base_price,
                    'delivery_fee' => 0,
                    'total' => (float) $product->base_price,
                    'payment_status' => $paymentStatus,
                ],
            );

            OrderItem::query()->firstOrCreate(
                ['order_id' => $order->id, 'product_id' => $product->id],
                ['product_name' => $product->name, 'quantity' => 1, 'unit_price' => $product->base_price],
            );

            $verificationStatus = match ($paymentStatus) {
                PaymentStatus::AwaitingVerification => PaymentVerificationStatus::PendingVerification,
                PaymentStatus::Refunded => PaymentVerificationStatus::Rejected,
                default => PaymentVerificationStatus::Verified,
            };

            Payment::query()->firstOrCreate(
                ['payable_type' => Order::class, 'payable_id' => $order->id],
                [
                    'method' => PaymentMethod::BankTransfer,
                    'amount' => $order->total,
                    'admin_bank_account_id' => $bankAccount->id,
                    'slip_path' => 'payment_slips/audit/order-'.$order->id.'.jpg',
                    'status' => $verificationStatus,
                    'submitted_by' => $customer->id,
                ],
            );

            // Review on completed orders, from the history customer only.
            if ($status === OrderStatus::Completed) {
                Review::query()->firstOrCreate(
                    ['order_id' => $order->id],
                    [
                        'customer_id' => $customer->id,
                        'seller_id' => $seller->id,
                        'product_id' => $product->id,
                        'rating' => 5,
                        'comment' => 'Absolutely delicious, would order again!',
                    ],
                );
            }
        }

        // ---- Extra pending payment-verification queue item (subscription) ---
        $subscription = SellerSubscription::query()->where('seller_id', $sellerActive->id)->first();
        if ($subscription) {
            Payment::query()->firstOrCreate(
                ['payable_type' => SellerSubscription::class, 'payable_id' => $subscription->id],
                [
                    'method' => PaymentMethod::BankTransfer,
                    'amount' => $paidPlan->price,
                    'admin_bank_account_id' => $bankAccount->id,
                    'slip_path' => 'payment_slips/audit/subscription-'.$subscription->id.'.jpg',
                    'status' => PaymentVerificationStatus::PendingVerification,
                    'submitted_by' => $sellerActive->user_id,
                ],
            );
        }

        // ---- Seller payouts (pending + confirmed) -------------------------
        $completedOrder = Order::query()->where('status', OrderStatus::Completed)->first();
        $deliveredOrder = Order::query()->where('status', OrderStatus::Delivered)->first();

        if ($completedOrder) {
            SellerPayout::query()->firstOrCreate(
                ['order_id' => $completedOrder->id],
                [
                    'seller_id' => $completedOrder->seller_id,
                    'amount' => $completedOrder->total,
                    'status' => SellerPayoutStatus::Confirmed,
                    'paid_by' => User::query()->where('role', UserRole::Admin)->first()?->id,
                    'paid_at' => now()->subDays(2),
                    'confirmed_at' => now()->subDay(),
                ],
            );
        }

        if ($deliveredOrder) {
            SellerPayout::query()->firstOrCreate(
                ['order_id' => $deliveredOrder->id],
                [
                    'seller_id' => $deliveredOrder->seller_id,
                    'amount' => $deliveredOrder->total,
                    'status' => SellerPayoutStatus::Pending,
                ],
            );
        }

        // ---- Customer cart (active cart customer) -------------------------
        CartItem::query()->firstOrCreate(
            ['user_id' => $customerWithCart->id, 'seller_id' => $sellerFree->id, 'product_id' => $productsFree[0]->id],
            ['quantity' => 2],
        );

        // ---- Ad, active + eligible today -----------------------------------
        Ad::query()->firstOrCreate(
            ['name' => 'Audit Homepage Banner'],
            [
                'description' => 'Seeded ad for the Phase 9 audit — should appear in the homepage carousel today.',
                'image_path' => null,
                'link_url' => 'https://cakehub.test/sellers/'.$sellerActive->slug,
                'paid_amount' => 50,
                'status' => 'active',
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addDays(14),
                'sort_order' => 0,
                'created_by' => User::query()->where('role', UserRole::Admin)->first()?->id,
            ],
        );
    }

    private function makeCustomer(string $email, string $name): User
    {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'google_id' => 'audit-'.Str::slug($email),
                'name' => $name,
                'role' => UserRole::Customer,
                'status' => UserStatus::Active,
            ],
        );

        CustomerProfile::query()->firstOrCreate(['user_id' => $user->id], ['phone' => '+94771234567']);

        Address::query()->firstOrCreate(
            ['user_id' => $user->id, 'label' => 'Home'],
            [
                'line1' => '123 Galle Road',
                'city' => 'Colombo',
                'postal_code' => '00300',
                'location' => new Point(6.9271, 79.8612),
                'is_default' => true,
            ],
        );

        return $user;
    }

    private function makeSeller(string $email, string $business, VerificationStatus $verification, StoreStatus $storeStatus): Seller
    {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'google_id' => 'audit-'.Str::slug($email),
                'name' => $business.' Owner',
                'role' => UserRole::Seller,
                'status' => UserStatus::Active,
            ],
        );

        $seller = Seller::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'business_name' => $business,
                'slug' => Str::slug($business),
                'whatsapp_number' => '+94771111111',
                'location' => new Point(6.9271, 79.8612),
                'address_line' => '45 Bakery Lane, Colombo',
                'store_status' => $storeStatus,
            ],
        );

        $seller->applyVerification($verification, $verification !== VerificationStatus::Pending ? User::query()->where('role', UserRole::Admin)->first()?->id : null);
        $seller->store_status = $storeStatus;
        $seller->save();

        return $seller->fresh();
    }

    /** @return array<int, Product> */
    private function makeProducts(Seller $seller, \Illuminate\Support\Collection $categories, string $label): array
    {
        $names = ["$label Chocolate Cake", "$label Vanilla Cupcakes", "$label Custom Order Cake"];
        $products = [];

        foreach ($names as $i => $name) {
            $product = Product::query()->firstOrCreate(
                ['seller_id' => $seller->id, 'name' => $name],
                [
                    'description' => 'Seeded product for the Phase 9 audit.',
                    'base_price' => 25 + ($i * 10),
                    'availability_status' => 'in_stock',
                    'is_active' => true,
                ],
            );

            if ($categories->isNotEmpty()) {
                $product->categories()->syncWithoutDetaching([$categories->first()]);
            }

            $products[] = $product;
        }

        return $products;
    }

    private function bankAccounts(): AdminBankAccount
    {
        $primary = AdminBankAccount::query()->firstOrCreate(
            ['account_number' => '1000200030004000'],
            [
                'bank_name' => 'Commercial Bank of Ceylon',
                'account_name' => 'CakeHub (Pvt) Ltd',
                'branch' => 'Colombo 03',
                'is_active' => true,
                'sort_order' => 0,
            ],
        );

        AdminBankAccount::query()->firstOrCreate(
            ['account_number' => '5000600070008000'],
            [
                'bank_name' => "Sampath Bank",
                'account_name' => 'CakeHub (Pvt) Ltd',
                'branch' => 'Kandy',
                'is_active' => false,
                'sort_order' => 1,
            ],
        );

        return $primary;
    }
}
