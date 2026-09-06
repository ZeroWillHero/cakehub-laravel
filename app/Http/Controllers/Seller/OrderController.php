<?php

namespace App\Http\Controllers\Seller;

use App\Enums\OrderStatus;
use App\Enums\SellerPayoutStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\FilterOrdersRequest;
use App\Http\Requests\Seller\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(FilterOrdersRequest $request): Response
    {
        $seller = $request->user()->seller;
        $filters = $request->validated();

        $orders = $seller->orders()
            ->with(['customer', 'items'])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['from'] ?? null, fn ($query, $from) => $query->whereDate('scheduled_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->whereDate('scheduled_at', '<=', $to))
            ->latest()
            ->get();

        return Inertia::render('Seller/Orders', [
            'orders' => OrderResource::collection($orders)->resolve(),
            'filters' => [
                'status' => $filters['status'] ?? null,
                'from' => $filters['from'] ?? null,
                'to' => $filters['to'] ?? null,
            ],
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $this->authorize('updateStatus', $order);

        $status = OrderStatus::from($request->validated('status'));
        $order->update(['status' => $status]);

        if ($status === OrderStatus::Completed && ! $order->payout()->exists()) {
            $order->payout()->create([
                'seller_id' => $order->seller_id,
                'amount' => $order->total,
                'status' => SellerPayoutStatus::Pending,
            ]);
        }

        $order->load(['customer', 'items']);
        $order->customer->notify(new OrderStatusUpdated($order));

        return (new OrderResource($order))->response();
    }
}
