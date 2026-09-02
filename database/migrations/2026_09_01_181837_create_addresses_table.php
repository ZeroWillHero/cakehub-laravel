<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->string('line1');
            $table->string('line2')->nullable();
            $table->string('city');
            $table->string('postal_code')->nullable();
            $table->geography('location', subtype: 'point', srid: 4326)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        DB::statement('CREATE INDEX addresses_location_gist ON addresses USING GIST (location)');
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
