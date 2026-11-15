<?php

namespace Tests\Feature;

use App\Models\HomeSection;
use App\Models\Performance;
use App\Models\Testimonial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomePageApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_returns_ordered_visible_sections_records_and_next_performance(): void
    {
        $hero = HomeSection::query()->create([
            'key' => 'hero',
            'component' => 'hero',
            'eyebrow' => 'Welcome',
            'title' => 'Music for everyone',
            'body' => "First paragraph.\n\nSecond paragraph.",
            'sort_order' => 1,
            'is_visible' => true,
        ]);

        $hero->items()->create([
            'item_type' => 'cta',
            'link_label' => 'Join us',
            'link_url' => '/about',
            'sort_order' => 2,
            'is_visible' => true,
        ]);

        $hero->items()->create([
            'item_type' => 'trust_point',
            'title' => 'No auditions',
            'sort_order' => 1,
            'is_visible' => true,
        ]);

        $hero->items()->create([
            'item_type' => 'trust_point',
            'title' => 'Hidden point',
            'sort_order' => 0,
            'is_visible' => false,
        ]);

        HomeSection::query()->create([
            'key' => 'hidden-section',
            'component' => 'hidden-section',
            'sort_order' => 0,
            'is_visible' => false,
        ]);

        HomeSection::query()->create([
            'key' => 'events',
            'component' => 'events',
            'eyebrow' => 'Upcoming',
            'title' => 'Concerts',
            'sort_order' => 2,
            'is_visible' => true,
        ]);

        HomeSection::query()->create([
            'key' => 'testimonials',
            'component' => 'testimonials',
            'eyebrow' => 'Voices',
            'title' => 'Why families come back',
            'sort_order' => 3,
            'is_visible' => true,
        ]);

        $past = $this->performance('2000-01-01', '10:00:00');
        $next = $this->performance('2099-05-01', '18:00:00');
        $later = $this->performance('2099-06-01', '15:00:00');
        $this->performance('2099-05-15', '12:00:00', ['is_published' => false]);
        $this->performance('2099-05-20', '12:00:00')->delete();

        $secondTestimonial = Testimonial::query()->create([
            'quote' => 'Second quote',
            'name' => 'Second Person',
            'role' => 'Parent',
            'sort_order' => 2,
            'is_published' => true,
        ]);

        $firstTestimonial = Testimonial::query()->create([
            'quote' => 'First quote',
            'name' => 'First Person',
            'role' => 'Student',
            'sort_order' => 1,
            'is_published' => true,
        ]);

        Testimonial::query()->create([
            'quote' => 'Hidden quote',
            'name' => 'Hidden Person',
            'role' => 'Hidden',
            'sort_order' => 0,
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/home');

        $response->assertOk()
            ->assertJsonPath('data.page', 'home')
            ->assertJsonCount(3, 'data.sections')
            ->assertJsonPath('data.sections.0.key', 'hero')
            ->assertJsonPath('data.sections.1.key', 'events')
            ->assertJsonPath('data.sections.2.key', 'testimonials')
            ->assertJsonCount(2, 'data.sections.0.items')
            ->assertJsonPath('data.sections.0.items.0.item_type', 'trust_point')
            ->assertJsonPath('data.sections.0.items.0.title', 'No auditions')
            ->assertJsonPath('data.sections.0.items.1.item_type', 'cta')
            ->assertJsonPath('data.sections.0.items.1.link_label', 'Join us')
            ->assertJsonPath('data.sections.1.records.0.id', $past->id)
            ->assertJsonPath('data.sections.1.records.1.id', $next->id)
            ->assertJsonPath('data.sections.1.records.2.id', $later->id)
            ->assertJsonPath('data.sections.1.records.1.start_time', '18:00')
            ->assertJsonCount(2, 'data.sections.2.records')
            ->assertJsonPath('data.sections.2.records.0.id', $firstTestimonial->id)
            ->assertJsonPath('data.sections.2.records.1.id', $secondTestimonial->id)
            ->assertJsonPath('data.next_performance.id', $next->id)
            ->assertJsonPath('data.next_performance.start_time', '18:00');

        $this->assertStringContainsString("\n\n", $response->json('data.sections.0.body'));
    }

    private function performance(string $date, string $time, array $overrides = []): Performance
    {
        return Performance::query()->create(array_merge([
            'title' => 'Performance '.$date.' '.$time,
            'performance_date' => $date,
            'start_time' => $time,
            'event_type' => 'Concert',
            'venue' => 'Test Venue',
            'city' => 'Test City',
            'duration_minutes' => 90,
            'conductor' => 'Test Conductor',
            'description' => 'Test description',
            'is_published' => true,
        ], $overrides));
    }
}
