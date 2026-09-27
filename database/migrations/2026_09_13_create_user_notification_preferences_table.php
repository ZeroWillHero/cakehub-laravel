<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Email notification preferences
            $table->boolean('email_order_status')->default(true);
            $table->boolean('email_payment_failed')->default(true);
            $table->boolean('email_subscription_expiry')->default(true);
            $table->boolean('email_promotions')->default(false);

            // Push notification preferences (for future use)
            $table->boolean('push_order_status')->default(false);
            $table->boolean('push_payment_failed')->default(false);

            $table->timestamps();

            // Unique constraint: one row per user
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notification_preferences');
    }
};
