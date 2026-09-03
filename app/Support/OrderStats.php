<?php

namespace App\Support;

use App\Enums\OrderStatus;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Small shared aggregation helpers for the Seller/Admin dashboard charts.
 */
class OrderStats
{
    public const VALID_RANGES = [7, 30, 90];
    public const DEFAULT_RANGE = 30;

    public static function normalizeRange(mixed $range): int
    {
        $range = (int) $range;

        return in_array($range, self::VALID_RANGES, true) ? $range : self::DEFAULT_RANGE;
    }

    /**
     * Daily order counts for the last $days days, zero-filled for days
     * with no orders, oldest first.
     *
     * @return array<int, array{date: string, count: int}>
     */
    public static function dailyCounts(Builder $query, int $days = self::DEFAULT_RANGE): array
    {
        $since = Carbon::today()->subDays($days - 1);

        $counts = (clone $query)
            ->where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->groupBy('day')
            ->pluck('count', 'day');

        $result = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $since->copy()->addDays($i)->toDateString();
            $result[] = ['date' => $date, 'count' => (int) ($counts[$date] ?? 0)];
        }

        return $result;
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
