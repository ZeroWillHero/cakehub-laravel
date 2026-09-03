<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Seller;
use App\Models\User;
use App\Support\OrderStats;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'customers' => User::query()->where('role', UserRole::Customer)->count(),
                'sellers' => Seller::query()->count(),
                'orders' => Order::query()->count(),
                'pending_verifications' => Seller::query()->where('verification_status', VerificationStatus::Pending)->count(),
            ],
            'analytics' => [
                'ordersOverTime' => OrderStats::dailyCounts(Order::query()),
                'newSellersOverTime' => OrderStats::dailyCounts(Seller::query()),
                'statusBreakdown' => OrderStats::statusBreakdown(Order::query()),
            ],
        ]);
    }
}
