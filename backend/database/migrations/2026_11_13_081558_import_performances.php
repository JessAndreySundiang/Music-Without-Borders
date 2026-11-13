<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $performances = [
            [
                'title' => 'Spring Wind Symphony Gala',
                'performance_date' => '2026-04-18',
                'event_type' => 'Concert',
                'venue' => 'Civic Center Auditorium',
                'city' => 'Springfield',
                'duration_minutes' => 90,
                'conductor' => 'Elena Martinez',
                'description' => 'Full wind ensemble program featuring classical overtures and modern film scores.',
            ],
            [
                'title' => 'Founders Day Street Parade',
                'performance_date' => '2026-05-09',
                'event_type' => 'Parade',
                'venue' => 'Main Street Boulevard',
                'city' => 'Springfield',
                'duration_minutes' => 60,
                'conductor' => 'Marcus Vance',
                'description' => 'Marching band showcase performing traditional marches and upbeat brass arrangements.',
            ],
            [
                'title' => 'Summer Twilight Pops in the Park',
                'performance_date' => '2026-06-21',
                'event_type' => 'Outdoor Festival',
                'venue' => 'Riverside Amphitheater',
                'city' => 'Oakridge',
                'duration_minutes' => 75,
                'conductor' => 'Elena Martinez',
                'description' => 'Family-friendly evening concert with jazz standards, swing medleys, and light classics.',
            ],
            [
                'title' => 'Youth Music Workshop & Showcase',
                'performance_date' => '2026-07-15',
                'event_type' => 'Community Outreach',
                'venue' => 'Community Arts Hall',
                'city' => 'Springfield',
                'duration_minutes' => 120,
                'conductor' => 'David Chen',
                'description' => 'Joint rehearsal and side-by-side performance with local high school band students.',
            ],
            [
                'title' => 'Autumn Brass & Percussion Night',
                'performance_date' => '2026-10-10',
                'event_type' => 'Concert',
                'venue' => 'Heritage Theater',
                'city' => 'Brookside',
                'duration_minutes' => 85,
                'conductor' => 'Marcus Vance',
                'description' => 'High-energy sectional spotlight featuring fanfares, rhythmic percussion ensembles, and soloists.',
            ],
            [
                'title' => 'Annual Holiday Benefit Concert',
                'performance_date' => '2026-12-12',
                'event_type' => 'Charity Gala',
                'venue' => 'Grand Symphony Hall',
                'city' => 'Springfield',
                'duration_minutes' => 100,
                'conductor' => 'Elena Martinez',
                'description' => 'Seasonal favorites and sing-along carols raising funds for local school instrument rentals.',
            ],
        ];

        DB::table('performances')->insert($performances);
    }

    public function down(): void
    {
        DB::table('performances')->truncate();
    }
};