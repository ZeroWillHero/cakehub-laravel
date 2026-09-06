<?php

namespace App\Http\Controllers\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $cartItems = $user->cartItems()->with(['product', 'variant'])->get();
        $sellerId = $cartItems->first()->seller_id;
        $subtotal = $cartItems->sum(fn ($item) => $item->unitPrice() * $item->quantity);

        $order = DB::transaction(function () use ($user, $data, $cartItems, $sellerId, $subtotal) {
            $order = Order::query()->create([
                'customer_id' => $user->id,
                'seller_id' => $sellerId,
                'status' => OrderStatus::Placed,
                'delivery_type' => $data['delivery_type'],
                'delivery_address_id' => $data['delivery_address_id'] ?? null,
                'scheduled_at' => $data['scheduled_at'],
                'subtotal' => $subtotal,
                'delivery_fee' => 0,
                'total' => $subtotal,
                // Manual bank-transfer payment (Phase 8): order starts unpaid until
                // the customer submits a slip via POST /api/payments, which flips
                // this to awaiting_verification pending admin review.
                'payment_status' => PaymentStatus::Pending,
            ]);

            foreach ($cartItems as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name' => $item->product->name,
                    'variant_name' => $item->variant?->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unitPrice(),
                    'customization_notes' => $item->customization_notes,
                ]);
            }

            $user->cartItems()->delete();

            return $order;
        });

        $order->load(['items', 'seller.user', 'deliveryAddress']);
        $order->seller->user->notify(new OrderStatusUpdated($order));

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(201);
    }
}
