<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('about_us_sections', function (Blueprint $table) {
            $table->id();
            $table->string('key', 64)->unique();
            $table->string('component', 64);
            $table->string('eyebrow')->nullable();
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->json('extra')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['sort_order', 'id']);
        });

        Schema::create('about_us_section_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('about_us_sections')->cascadeOnDelete();
            $table->string('item_type', 32);
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->string('value')->nullable();
            $table->string('icon', 32)->nullable();
            $table->string('link_label')->nullable();
            $table->string('link_url')->nullable();
            $table->string('image_path')->nullable();
            $table->json('extra')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['section_id', 'item_type', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('about_us_section_items');
        Schema::dropIfExists('about_us_sections');
    }
};
