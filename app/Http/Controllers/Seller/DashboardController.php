<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\SellerResource;
use App\Support\OrderStats;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $seller = request()->user()->seller;
        $hasAnalytics = $seller->hasAnalyticsAccess();

        return Inertia::render('Seller/Dashboard', [
            'seller' => (new SellerResource($seller))->resolve(),
            'usage' => $seller->listingUsage(),
            'limit' => $seller->listingLimit(),
            'hasAnalyticsAccess' => $hasAnalytics,
            'recentOrders' => OrderResource::collection(
                $seller->orders()->with(['customer', 'items'])->latest()->limit(5)->get()
            )->resolve(),
            'analytics' => $hasAnalytics ? [
                'ordersOverTime' => OrderStats::dailyCounts($seller->orders()),
                'statusBreakdown' => OrderStats::statusBreakdown($seller->orders()),
                'orderValueTotal' => (float) $seller->orders()->where('status', 'completed')->sum('total'),
            ] : null,
        ]);
    }
}
