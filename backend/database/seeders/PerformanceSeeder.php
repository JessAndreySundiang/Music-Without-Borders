<?php

namespace Database\Seeders;

use App\Models\Performance;
use Illuminate\Database\Seeder;

class PerformanceSeeder extends Seeder
{
    public function run(): void
    {
        // Remove the original fictional US sample rows if they are still in the
        // database. Only these exact titles are touched; real rows are left alone.
        Performance::withTrashed()
            ->whereIn('title', [
                'Spring Wind Symphony Gala',
                'Founders Day Street Parade',
                'Summer Twilight Pops in the Park',
                'Youth Music Workshop & Showcase',
                'Autumn Brass & Percussion Night',
                'Annual Holiday Benefit Concert',
            ])
            ->forceDelete();

        $performances = [
            [
                'title' => 'Autumn Plaza Concert',
                'performance_date' => '2026-11-28',
                'start_time' => '16:00:00',
                'event_type' => 'Concert',
                'venue' => 'Mexico Municipal Plaza',
                'city' => 'Mexico, Pampanga',
                'duration_minutes' => 90,
                'conductor' => 'Volunteer Music Director',
                'description' => 'An afternoon of brass, woodwind, and percussion favorites at the Mexico Municipal Plaza. Bring a chair and the whole family.',
            ],
            [
                'title' => 'Pasko sa Plaza',
                'performance_date' => '2026-12-05',
                'start_time' => '16:00:00',
                'event_type' => 'Outdoor Festival',
                'venue' => 'Mexico Municipal Plaza',
                'city' => 'Mexico, Pampanga',
                'duration_minutes' => 75,
                'conductor' => 'Volunteer Music Director',
                'description' => 'A free holiday festival with folk songs, carols, and a special set from the youth ensemble.',
            ],
            [
                'title' => 'Carols and Brass',
                'performance_date' => '2026-12-13',
                'start_time' => '18:00:00',
                'event_type' => 'Concert',
                'venue' => 'Provincial Capitol Grounds',
                'city' => 'San Fernando, Pampanga',
                'duration_minutes' => 90,
                'conductor' => 'Volunteer Music Director',
                'description' => 'An evening of carols, brass fanfares, and sing-along favorites under the capitol lights.',
            ],
            [
                'title' => 'Holiday Benefit Concert',
                'performance_date' => '2026-12-20',
                'start_time' => '17:00:00',
                'event_type' => 'Charity Gala',
                'venue' => 'Pandacaqui Community Center',
                'city' => 'Mexico, Pampanga',
                'duration_minutes' => 100,
                'conductor' => 'Volunteer Music Director',
                'description' => 'A benefit concert for the instrument lending library, featuring soloists from the youth and senior ensembles.',
            ],
            [
                'title' => 'Community Caroling',
                'performance_date' => '2026-12-26',
                'start_time' => '15:00:00',
                'event_type' => 'Community Outreach',
                'venue' => 'Mexico Municipal Plaza',
                'city' => 'Mexico, Pampanga',
                'duration_minutes' => 60,
                'conductor' => 'Volunteer Music Director',
                'description' => 'Community caroling through the plaza, with song sheets for everyone and a chance to join the band.',
            ],
            [
                'title' => "New Year's Eve Serenade",
                'performance_date' => '2026-12-31',
                'start_time' => '20:00:00',
                'event_type' => 'Concert',
                'venue' => 'Provincial Capitol Grounds',
                'city' => 'San Fernando, Pampanga',
                'duration_minutes' => 75,
                'conductor' => 'Volunteer Music Director',
                'description' => 'Close the year with a free outdoor concert of marches, light classics, and Filipino favorites.',
            ],
        ];

        foreach ($performances as $performance) {
            Performance::query()->updateOrCreate(
                [
                    'title' => $performance['title'],
                    'performance_date' => $performance['performance_date'],
                ],
                [
                    'start_time' => $performance['start_time'],
                    'event_type' => $performance['event_type'],
                    'venue' => $performance['venue'],
                    'city' => $performance['city'],
                    'duration_minutes' => $performance['duration_minutes'],
                    'conductor' => $performance['conductor'],
                    'description' => $performance['description'],
                    'is_published' => true,
                ]
            );
        }
    }
}
