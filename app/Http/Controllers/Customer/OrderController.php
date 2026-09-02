<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = $request->user()->orders()
            ->with(['seller', 'items'])
            ->latest()
            ->get();

        return Inertia::render('Customer/OrderHistory', [
            'orders' => OrderResource::collection($orders)->resolve(),
        ]);
    }

    public function show(Order $order): Response
    {
        $this->authorize('view', $order);

        return Inertia::render('Customer/OrderDetail', [
            'order' => (new OrderResource($order->load(['seller', 'items', 'deliveryAddress', 'review'])))->resolve(),
        ]);
    }
}
