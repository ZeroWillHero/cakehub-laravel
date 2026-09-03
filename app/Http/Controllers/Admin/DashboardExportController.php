<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Seller;
use App\Support\OrderStats;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DashboardExportController extends Controller
{
    public function export(): StreamedResponse
    {
        $ordersOverTime = OrderStats::dailyCounts(Order::query());
        $newSellersOverTime = OrderStats::dailyCounts(Seller::query());
        $statusBreakdown = OrderStats::statusBreakdown(Order::query());

        $filename = 'cakehub-admin-stats-'.now()->toDateString().'.csv';

        return response()->streamDownload(function () use ($ordersOverTime, $newSellersOverTime, $statusBreakdown) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['Date', 'Orders', 'New sellers']);
            foreach ($ordersOverTime as $index => $day) {
                fputcsv($out, [$day['date'], $day['count'], $newSellersOverTime[$index]['count']]);
            }

            fputcsv($out, []);
            fputcsv($out, ['Order status', 'Count']);
            foreach ($statusBreakdown as $status => $count) {
                fputcsv($out, [$status, $count]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
