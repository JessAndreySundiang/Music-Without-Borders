<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const FROM = 'Community Music Band';

    private const TO = 'Music Without Borders';

    public function up(): void
    {
        $this->replaceBrand('Community Music Band Organization', self::TO);
        $this->replaceBrand(self::FROM, self::TO);
    }

    public function down(): void
    {
        $this->replaceBrand(self::TO, self::FROM);
    }

    /**
     * Rebrand existing CMS content without touching the configured admin email.
     *
     * Fresh installs run this before the seeders, so it is a no-op there. Existing
     * installations get the same brand in their editable content immediately.
     */
    private function replaceBrand(string $from, string $to): void
    {
        $targets = [
            'site_settings' => ['value'],
            'stories' => ['title', 'excerpt', 'body', 'author_name'],
            'home_sections' => ['eyebrow', 'title', 'body', 'extra'],
            'home_section_items' => ['title', 'body', 'value', 'extra'],
            'about_us_sections' => ['eyebrow', 'title', 'body', 'extra'],
            'about_us_section_items' => ['title', 'body', 'value', 'extra'],
            'performances' => ['title', 'description', 'conductor'],
            'testimonials' => ['quote', 'name', 'role'],
            'users' => ['name'],
        ];

        foreach ($targets as $table => $columns) {
            foreach ($columns as $column) {
                DB::table($table)
                    ->where($column, 'like', "%{$from}%")
                    ->update([
                        $column => DB::raw("REPLACE({$column}, '{$from}', '{$to}')"),
                    ]);
            }
        }
    }
};
