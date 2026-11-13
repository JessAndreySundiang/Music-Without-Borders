<?php

namespace Tests\Feature;

use App\Models\Performance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerformanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_all_performances(): void
    {
        $response = $this->getJson('/api/performances');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'performance_date',
                        'event_type',
                        'venue',
                        'city',
                        'duration_minutes',
                        'conductor',
                        'description',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(1, count($data));
    }

    public function test_can_view_single_performance(): void
    {
        $performance = Performance::first();
        $this->assertNotNull($performance, 'Performance record must exist');

        $response = $this->getJson('/api/performances/'.$performance->id);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $performance->id,
                    'title' => $performance->title,
                    'performance_date' => $performance->performance_date->format('Y-m-d'),
                    'event_type' => $performance->event_type,
                    'venue' => $performance->venue,
                    'city' => $performance->city,
                    'duration_minutes' => $performance->duration_minutes,
                    'conductor' => $performance->conductor,
                    'description' => $performance->description,
                ],
            ]);
    }

    public function test_returns_404_for_nonexistent_performance(): void
    {
        $response = $this->getJson('/api/performances/99999');

        $response->assertStatus(404);
    }
}
