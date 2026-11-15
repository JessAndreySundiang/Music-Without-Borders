<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_returns_a_flat_key_value_map(): void
    {
        SiteSetting::query()->create([
            'group_name' => 'site',
            'key' => 'site.name',
            'value' => 'Music Without Borders',
        ]);

        SiteSetting::query()->create([
            'group_name' => 'contact',
            'key' => 'contact.phone_label',
            'value' => '0994-329-5457',
        ]);

        SiteSetting::query()->create([
            'group_name' => 'seo',
            'key' => 'seo.about.page_title',
            'value' => 'About',
        ]);

        $response = $this->getJson('/api/settings')->assertOk();
        $data = $response->json('data');

        $this->assertSame('Music Without Borders', $data['site.name']);
        $this->assertSame('0994-329-5457', $data['contact.phone_label']);
        $this->assertSame('About', $data['seo.about.page_title']);
    }
}
