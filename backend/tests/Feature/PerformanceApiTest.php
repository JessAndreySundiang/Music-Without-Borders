<?php

namespace Tests\Feature;

use App\Models\Performance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerformanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_only_published_performances_in_date_order(): void
    {
        $later = $this->performance('2099-06-01', '10:00:00');
        $earlier = $this->performance('2099-05-01', '18:00:00');
        $sameDayEarlier = $this->performance('2099-05-01', '09:00:00');
        $this->performance('2099-05-15', '12:00:00', ['is_published' => false]);

        $deleted = $this->performance('2099-05-20', '12:00:00');
        $deleted->delete();

        $response = $this->getJson('/api/performances');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.id', $sameDayEarlier->id)
            ->assertJsonPath('data.1.id', $earlier->id)
            ->assertJsonPath('data.2.id', $later->id)
            ->assertJsonPath('data.0.start_time', '09:00')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'performance_date',
                        'start_time',
                        'event_type',
                        'venue',
                        'city',
                        'duration_minutes',
                        'conductor',
                        'description',
                    ],
                ],
            ]);
    }

    public function test_can_view_a_published_performance(): void
    {
        $performance = $this->performance('2099-07-01', '17:00:00');

        $this->getJson('/api/performances/'.$performance->id)
            ->assertOk()
            ->assertJsonPath('data.id', $performance->id)
            ->assertJsonPath('data.performance_date', '2099-07-01')
            ->assertJsonPath('data.start_time', '17:00');
    }

    public function test_unpublished_and_deleted_performances_are_hidden(): void
    {
        $unpublished = $this->performance('2099-08-01', '17:00:00', ['is_published' => false]);
        $deleted = $this->performance('2099-08-02', '17:00:00');
        $deleted->delete();

        $this->getJson('/api/performances/'.$unpublished->id)->assertNotFound();
        $this->getJson('/api/performances/'.$deleted->id)->assertNotFound();
        $this->getJson('/api/performances/99999')->assertNotFound();
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
