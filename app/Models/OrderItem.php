<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'order_id', 'product_id', 'product_variant_id', 'product_name',
    'variant_name', 'quantity', 'unit_price', 'customization_notes',
])]
class OrderItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
