<?php

namespace Database\Seeders\Concerns;

use Illuminate\Database\Eloquent\Model;

trait SeedsSections
{
    /**
     * Create or update one page's sections and replace their items with the
     * seeded values. Re-running the seeder therefore resets page copy to the
     * known baseline instead of creating duplicate rows.
     *
     * @param  class-string<Model>  $sectionModel
     * @param  array<int, array<string, mixed>>  $sections
     */
    protected function seedSections(string $sectionModel, array $sections): void
    {
        foreach ($sections as $index => $data) {
            /** @var Model $section */
            $section = $sectionModel::query()->updateOrCreate(
                ['key' => $data['key']],
                [
                    'component' => $data['component'] ?? $data['key'],
                    'eyebrow' => $data['eyebrow'] ?? null,
                    'title' => $data['title'] ?? null,
                    'body' => $data['body'] ?? null,
                    'extra' => $data['extra'] ?? null,
                    'sort_order' => $index + 1,
                    'is_visible' => $data['is_visible'] ?? true,
                ]
            );

            $section->items()->delete();

            foreach ($data['items'] ?? [] as $itemIndex => $item) {
                $section->items()->create([
                    'item_type' => $item['item_type'],
                    'title' => $item['title'] ?? null,
                    'body' => $item['body'] ?? null,
                    'value' => $item['value'] ?? null,
                    'icon' => $item['icon'] ?? null,
                    'link_label' => $item['link_label'] ?? null,
                    'link_url' => $item['link_url'] ?? null,
                    'image_path' => $item['image_path'] ?? null,
                    'extra' => $item['extra'] ?? null,
                    'sort_order' => $itemIndex + 1,
                    'is_visible' => $item['is_visible'] ?? true,
                ]);
            }
        }
    }
}
