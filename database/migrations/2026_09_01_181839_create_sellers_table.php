<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sellers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('business_name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('whatsapp_number');
            $table->geography('location', subtype: 'point', srid: 4326)->nullable();
            $table->string('address_line')->nullable();
            $table->jsonb('operating_hours')->nullable();
            $table->string('store_status')->default('closed');
            $table->string('verification_status')->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->timestamps();
        });

        DB::statement('CREATE INDEX sellers_location_gist ON sellers USING GIST (location)');
    }

    public function down(): void
    {
        Schema::dropIfExists('sellers');
    }
};
