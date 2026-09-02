<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Placed = 'placed';
    case Confirmed = 'confirmed';
    case Preparing = 'preparing';
    case Ready = 'ready';
    case Delivered = 'delivered';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /**
     * Valid next statuses a seller can move an order to from its current
     * status — enforced in UpdateOrderStatusRequest, not just the UI.
     */
    public function allowedNextStatuses(): array
    {
        return match ($this) {
            self::Placed => [self::Confirmed, self::Cancelled],
            self::Confirmed => [self::Preparing, self::Cancelled],
            self::Preparing => [self::Ready, self::Cancelled],
            self::Ready => [self::Delivered],
            self::Delivered => [self::Completed],
            self::Completed, self::Cancelled => [],
        };
    }
}
