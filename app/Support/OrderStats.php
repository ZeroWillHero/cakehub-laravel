<?php

namespace App\Support;

use App\Enums\OrderStatus;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Small shared aggregation helpers for the Seller/Admin dashboard charts.
 * Fixed 30-day window (see docs/plan-analytics-and-location.md — no
 * range picker in this pass).
 */
class OrderStats
{
    public const DAYS = 30;

    /**
     * Daily order counts for the last self::DAYS days, zero-filled for
     * days with no orders, oldest first.
     *
     * @return array<int, array{date: string, count: int}>
     */
    public static function dailyCounts(Builder $query): array
    {
        $since = Carbon::today()->subDays(self::DAYS - 1);

        $counts = (clone $query)
            ->where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->groupBy('day')
            ->pluck('count', 'day');

        $days = [];
        for ($i = 0; $i < self::DAYS; $i++) {
            $date = $since->copy()->addDays($i)->toDateString();
            $days[] = ['date' => $date, 'count' => (int) ($counts[$date] ?? 0)];
        }

        return $days;
    }

    /**
     * @return array<string, int>
     */
    public static function statusBreakdown(Builder $query): array
    {
        $counts = (clone $query)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $breakdown = [];
        foreach (OrderStatus::cases() as $status) {
            $breakdown[$status->value] = (int) ($counts[$status->value] ?? 0);
        }

        return $breakdown;
    }
}
