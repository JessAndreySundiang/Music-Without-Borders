<?php

namespace Tests\Feature;

use App\Models\AboutUsSection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AboutPageApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_about_returns_ordered_visible_sections_and_items(): void
    {
        $mission = AboutUsSection::query()->create([
            'key' => 'mission',
            'component' => 'mission',
            'eyebrow' => 'Our mission',
            'title' => 'Why we exist',
            'body' => 'Mission statement.',
            'sort_order' => 2,
            'is_visible' => true,
        ]);

        $mission->items()->create([
            'item_type' => 'pillar',
            'title' => 'Access',
            'body' => 'Everyone can join.',
            'icon' => 'IconKey',
            'sort_order' => 1,
            'is_visible' => true,
        ]);

        $hero = AboutUsSection::query()->create([
            'key' => 'page_hero',
            'component' => 'page_hero',
            'eyebrow' => 'About us',
            'title' => 'Our story',
            'body' => 'Hero body.',
            'sort_order' => 1,
            'is_visible' => true,
        ]);

        $hero->items()->create([
            'item_type' => 'cta',
            'link_label' => 'Visit',
            'link_url' => '#join',
            'sort_order' => 2,
            'is_visible' => true,
        ]);

        $hero->items()->create([
            'item_type' => 'cta',
            'link_label' => 'Donate',
            'link_url' => '/donate',
            'sort_order' => 1,
            'is_visible' => true,
        ]);

        AboutUsSection::query()->create([
            'key' => 'hidden',
            'component' => 'hidden',
            'sort_order' => 0,
            'is_visible' => false,
        ]);

        $response = $this->getJson('/api/about');

        $response->assertOk()
            ->assertJsonPath('data.page', 'about')
            ->assertJsonCount(2, 'data.sections')
            ->assertJsonPath('data.sections.0.key', 'page_hero')
            ->assertJsonPath('data.sections.1.key', 'mission')
            ->assertJsonCount(2, 'data.sections.0.items')
            ->assertJsonPath('data.sections.0.items.0.link_label', 'Donate')
            ->assertJsonPath('data.sections.0.items.1.link_label', 'Visit')
            ->assertJsonPath('data.sections.1.items.0.title', 'Access')
            ->assertJsonPath('data.sections.1.items.0.icon', 'IconKey');

        $this->assertArrayNotHasKey('next_performance', $response->json('data'));
    }
}
