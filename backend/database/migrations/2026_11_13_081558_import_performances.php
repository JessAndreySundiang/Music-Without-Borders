<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Performance data now lives in Database\Seeders\PerformanceSeeder.
     *
     * This migration is intentionally a no-op. It stays in the history because
     * the first local/staging install already ran it; deleting it would make
     * rollbacks and migration-state checks confusing. The seeder removes the
     * original fictional rows by title before inserting the current sample
     * schedule, so existing installs are cleaned up safely.
     */
    public function up(): void
    {
        //
    }

    public function down(): void
    {
        //
    }
};
