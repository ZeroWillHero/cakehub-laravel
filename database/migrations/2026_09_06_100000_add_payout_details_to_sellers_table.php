<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sellers', function (Blueprint $table) {
            $table->string('payout_bank_name')->nullable()->after('average_rating');
            $table->string('payout_account_name')->nullable()->after('payout_bank_name');
            $table->string('payout_account_number')->nullable()->after('payout_account_name');
        });
    }

    public function down(): void
    {
        Schema::table('sellers', function (Blueprint $table) {
            $table->dropColumn(['payout_bank_name', 'payout_account_name', 'payout_account_number']);
        });
    }
};
