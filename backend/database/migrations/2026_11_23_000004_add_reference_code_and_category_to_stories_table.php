<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->string('reference_code', 32)->nullable()->unique()->after('slug');
            $table->string('category', 40)->default('community')->after('status')->index();
        });

        // Backfill existing stories with unique reference codes
        $stories = DB::table('stories')->whereNull('reference_code')->select('id')->get();
        foreach ($stories as $story) {
            DB::table('stories')->where('id', $story->id)->update([
                'reference_code' => 'MWB-'.Str::upper(Str::random(8)),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropUnique(['reference_code']);
            $table->dropIndex(['category']);
            $table->dropColumn(['reference_code', 'category']);
        });
    }
};
