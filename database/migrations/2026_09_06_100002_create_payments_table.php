<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->morphs('payable'); // Order or SellerSubscription today; future gateway charges reuse this table.
            $table->string('method')->default('bank_transfer');
            $table->decimal('amount', 10, 2);
            $table->foreignId('admin_bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slip_path');
            $table->string('status')->default('pending_verification'); // pending_verification|verified|rejected
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
