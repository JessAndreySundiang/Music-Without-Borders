<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('performances', function (Blueprint $table) {
            $table->time('start_time')->nullable();
            $table->boolean('is_published')->default(true);
            $table->softDeletes();
            $table->index(['is_published', 'performance_date']);
        });
    }

    public function down(): void
    {
        Schema::table('performances', function (Blueprint $table) {
            $table->dropIndex(['is_published', 'performance_date']);
            $table->dropSoftDeletes();
            $table->dropColumn(['start_time', 'is_published']);
        });
    }
};
