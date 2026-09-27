<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sellers', function (Blueprint $table) {
            // Stored only — payment is stubbed (Phase 0 decision), these
            // fields are functionally inert until a real payout mechanism
            // is wired up. See docs/plan-settings-avatars-product-reviews.md.
            $table->string('payout_bank_name')->nullable();
            $table->string('payout_account_name')->nullable();
            $table->string('payout_account_number')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('sellers', function (Blueprint $table) {
            $table->dropColumn(['payout_bank_name', 'payout_account_name', 'payout_account_number']);
        });
    }
};
