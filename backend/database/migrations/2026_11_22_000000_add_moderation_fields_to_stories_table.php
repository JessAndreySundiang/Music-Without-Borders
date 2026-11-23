<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->string('status', 20)->default('draft')->after('cover_image_path');
            $table->string('author_email')->nullable()->after('author_role');
            $table->timestamp('consent_at')->nullable()->after('author_email');
            $table->foreignId('reviewed_by')
                ->nullable()
                ->after('consent_at')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->text('rejection_reason')->nullable()->after('reviewed_at');
        });

        // Existing published stories stay public; everything else becomes a draft.
        DB::table('stories')->where('is_published', true)->update(['status' => 'approved']);
        DB::table('stories')->where('is_published', false)->update(['status' => 'draft']);

        Schema::table('stories', function (Blueprint $table) {
            $table->dropIndex(['is_published', 'published_at']);
            $table->dropColumn('is_published');
            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->boolean('is_published')->default(false)->after('cover_image_path');
        });

        DB::table('stories')->where('status', 'approved')->update(['is_published' => true]);

        Schema::table('stories', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropIndex(['status', 'published_at']);
            $table->dropColumn([
                'status',
                'author_email',
                'consent_at',
                'reviewed_by',
                'reviewed_at',
                'rejection_reason',
            ]);
        });

        Schema::table('stories', function (Blueprint $table) {
            $table->index(['is_published', 'published_at']);
        });
    }
};
