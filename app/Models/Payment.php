<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentVerificationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'payable_type', 'payable_id', 'method', 'amount', 'admin_bank_account_id',
    'slip_path', 'status', 'submitted_by', 'verified_by', 'verified_at', 'rejection_reason',
])]
class Payment extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'method' => PaymentMethod::class,
            'status' => PaymentVerificationStatus::class,
            'amount' => 'decimal:2',
            'verified_at' => 'datetime',
        ];
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    public function adminBankAccount(): BelongsTo
    {
        return $this->belongsTo(AdminBankAccount::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
