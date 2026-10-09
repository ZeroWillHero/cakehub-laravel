<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A6 Orders Oversight (docs/screens.md) — read-only list of every order on
 * the platform. The list payload already carries everything the detail
 * sheet shows, so there's no separate show endpoint.
 */
class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'status' => OrderStatus::tryFrom((string) $request->query('status'))?->value,
            'payment_status' => PaymentStatus::tryFrom((string) $request->query('payment_status'))?->value,
            'from' => $this->date($request->query('from')),
            'to' => $this->date($request->query('to')),
            'customer' => $this->id($request->query('customer')),
            'seller' => $this->id($request->query('seller')),
        ];

        $orders = Order::query()
            ->with(['customer', 'seller', 'items', 'deliveryAddress'])
            ->when($filters['search'] !== '', function ($query) use ($filters) {
                $search = ltrim($filters['search'], '#');
                $like = '%'.addcslashes($search, '%_\\').'%';

                $query->where(function ($inner) use ($search, $like) {
                    if (ctype_digit($search)) {
                        $inner->where('id', (int) $search);
                    }

                    $inner->orWhereHas('customer', fn ($customer) => $customer
                        ->where('name', 'ilike', $like)
                        ->orWhere('email', 'ilike', $like))
                        ->orWhereHas('seller', fn ($seller) => $seller->where('business_name', 'ilike', $like));
                });
            })
            ->when($filters['status'], fn ($query, $status) => $query->where('status', $status))
            ->when($filters['payment_status'], fn ($query, $status) => $query->where('payment_status', $status))
            ->when($filters['from'], fn ($query, $from) => $query->whereDate('created_at', '>=', $from))
            ->when($filters['to'], fn ($query, $to) => $query->whereDate('created_at', '<=', $to))
            ->when($filters['customer'], fn ($query, $id) => $query->where('customer_id', $id))
            ->when($filters['seller'], fn ($query, $id) => $query->where('seller_id', $id))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Orders', [
            'orders' => [
                'data' => OrderResource::collection($orders->items())->resolve(),
                'meta' => PaginationMeta::from($orders),
            ],
            'filters' => $filters,
        ]);
    }

    private function date(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return Carbon::createFromFormat('!Y-m-d', $value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function id(mixed $value): ?int
    {
        return is_string($value) && ctype_digit($value) ? (int) $value : null;
    }
}
