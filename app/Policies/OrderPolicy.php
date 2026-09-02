<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $user->id === $order->customer_id || $user->seller?->id === $order->seller_id;
    }

    public function updateStatus(User $user, Order $order): bool
    {
        return $user->seller?->id === $order->seller_id;
    }

    public function cancel(User $user, Order $order): bool
    {
        return $user->id === $order->customer_id || $user->seller?->id === $order->seller_id;
    }

    public function review(User $user, Order $order): bool
    {
        return $user->id === $order->customer_id;
    }
}
