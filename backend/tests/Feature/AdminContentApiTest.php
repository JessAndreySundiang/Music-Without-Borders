<?php

namespace Tests\Feature;

use App\Models\AboutUsSection;
use App\Models\HomeSection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminContentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_home_includes_hidden_sections_and_items(): void
    {
        Sanctum::actingAs($this->admin());

        $section = HomeSection::query()->create([
            'key' => 'hero',
            'component' => 'hero',
            'title' => 'Visible',
            'sort_order' => 1,
            'is_visible' => true,
        ]);
        $section->items()->create([
            'item_type' => 'cta',
            'link_label' => 'Hidden CTA',
            'sort_order' => 1,
            'is_visible' => false,
        ]);
        HomeSection::query()->create([
            'key' => 'hidden',
            'component' => 'cta',
            'sort_order' => 2,
            'is_visible' => false,
        ]);

        $this->getJson('/api/admin/home')
            ->assertOk()
            ->assertJsonCount(2, 'data.sections')
            ->assertJsonPath('data.sections.0.items.0.link_label', 'Hidden CTA')
            ->assertJsonPath('data.sections.1.key', 'hidden');
    }

    public function test_admin_can_edit_a_section_item_and_settings(): void
    {
        Sanctum::actingAs($this->admin());

        $section = AboutUsSection::query()->create([
            'key' => 'mission',
            'component' => 'mission',
            'title' => 'Old title',
            'sort_order' => 1,
            'is_visible' => true,
        ]);
        $item = $section->items()->create([
            'item_type' => 'pillar',
            'title' => 'Old pillar',
            'sort_order' => 1,
            'is_visible' => true,
        ]);

        $this->patchJson('/api/admin/about/sections/'.$section->id, [
            'title' => 'New title',
            'is_visible' => false,
        ])->assertOk()
            ->assertJsonPath('data.title', 'New title')
            ->assertJsonPath('data.is_visible', false);

        $this->patchJson('/api/admin/about/items/'.$item->id, [
            'title' => 'New pillar',
            'is_visible' => false,
        ])->assertOk()
            ->assertJsonPath('data.title', 'New pillar')
            ->assertJsonPath('data.is_visible', false);

        $this->patchJson('/api/admin/settings', [
            'settings' => [
                'seo.stories.page_title' => 'Notes from the Bandstand',
            ],
        ])->assertOk();

        $this->assertDatabaseHas('site_settings', [
            'key' => 'seo.stories.page_title',
            'value' => 'Notes from the Bandstand',
        ]);
    }

    public function test_admin_can_reorder_sections_and_items(): void
    {
        Sanctum::actingAs($this->admin());

        $first = HomeSection::query()->create([
            'key' => 'first',
            'component' => 'cta',
            'sort_order' => 1,
            'is_visible' => true,
        ]);
        $second = HomeSection::query()->create([
            'key' => 'second',
            'component' => 'cta',
            'sort_order' => 2,
            'is_visible' => true,
        ]);
        $firstItem = $first->items()->create([
            'item_type' => 'cta',
            'link_label' => 'First',
            'sort_order' => 1,
            'is_visible' => true,
        ]);
        $secondItem = $first->items()->create([
            'item_type' => 'cta',
            'link_label' => 'Second',
            'sort_order' => 2,
            'is_visible' => true,
        ]);

        $this->putJson('/api/admin/home/sections/reorder', [
            'ids' => [$second->id, $first->id],
        ])->assertOk();

        $this->assertSame(1, $second->fresh()->sort_order);
        $this->assertSame(2, $first->fresh()->sort_order);

        $this->putJson('/api/admin/home/items/reorder', [
            'ids' => [$secondItem->id, $firstItem->id],
        ])->assertOk();

        $this->assertSame(1, $secondItem->fresh()->sort_order);
        $this->assertSame(2, $firstItem->fresh()->sort_order);
    }

    private function admin(): User
    {
        return User::query()->create([
            'name' => 'Test Admin',
            'email' => 'content-admin@example.com',
            'password' => Hash::make('correct-password'),
            'is_admin' => true,
        ]);
    }
}
