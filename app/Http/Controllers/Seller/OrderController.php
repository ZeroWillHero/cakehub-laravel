<?php

namespace App\Http\Controllers\Seller;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $seller = $request->user()->seller;

        $orders = $seller->orders()
            ->with(['customer', 'items'])
            ->latest()
            ->get();

        return Inertia::render('Seller/Orders', [
            'orders' => OrderResource::collection($orders)->resolve(),
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $this->authorize('updateStatus', $order);

        $order->update(['status' => OrderStatus::from($request->validated('status'))]);
        $order->load(['customer', 'items']);
        $order->customer->notify(new OrderStatusUpdated($order));

        return (new OrderResource($order))->response();
    }
}
