<?php

namespace App\Models;

use App\Enums\AdStatus;
use App\Helpers\CloudinaryHelper;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'description', 'image_path', 'link_url', 'paid_amount', 'status', 'starts_at', 'ends_at', 'sort_order', 'created_by'])]
class Ad extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => AdStatus::class,
            'paid_amount' => 'decimal:2',
            'starts_at' => 'date',
            'ends_at' => 'date',
        ];
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->image_path ? CloudinaryHelper::getImageUrl($this->image_path) : null,
        );
    }

    /** Ads currently eligible for the homepage carousel: active and within their date range. */
    public function scopeEligible(Builder $query): Builder
    {
        return $query
            ->where('status', AdStatus::Active)
            ->whereDate('starts_at', '<=', now())
            ->whereDate('ends_at', '>=', now());
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
