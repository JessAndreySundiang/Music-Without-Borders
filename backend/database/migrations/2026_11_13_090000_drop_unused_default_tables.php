<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The site does not use database sessions, cache, queues, or Laravel's
     * password-reset broker. The drivers are switched to file/sync in .env,
     * and admin password resets use a short-lived signed link instead.
     */
    public function up(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('password_reset_tokens');
    }

    public function down(): void
    {
        // Intentionally left empty: restoring unused framework tables would
        // reintroduce the clutter this CMS is meant to remove.
    }
};
