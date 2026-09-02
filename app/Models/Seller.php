<?php

namespace App\Models;

use App\Enums\StoreStatus;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Traits\HasSpatial;

#[Fillable([
    'user_id', 'business_name', 'slug', 'description', 'logo_path', 'cover_path',
    'whatsapp_number', 'location', 'address_line', 'operating_hours', 'store_status',
])]
class Seller extends Model
{
    use HasFactory, HasSpatial;

    protected function casts(): array
    {
        return [
            'location' => Point::class,
            'operating_hours' => 'array',
            'store_status' => StoreStatus::class,
            'verification_status' => VerificationStatus::class,
            'verified_at' => 'datetime',
            'average_rating' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
