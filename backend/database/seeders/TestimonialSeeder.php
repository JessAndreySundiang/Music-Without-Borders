<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $testimonials = [
            [
                'name' => 'Marites R.',
                'role' => 'Parent of a youth student',
                'quote' => 'My daughter had never touched an instrument. Two years later she is playing clarinet in the plaza concert — and it has never cost us a cent.',
            ],
            [
                'name' => 'Eduardo S.',
                'role' => 'Senior Ensemble member',
                'quote' => 'I played trumpet in school and thought that part of my life was over. The Saturday ensemble gave it back to me at 61.',
            ],
            [
                'name' => 'Liza M.',
                'role' => 'Neighbor and regular listener',
                'quote' => 'The monthly concert is the one night the whole barangay shows up together. It brings everyone, young and old, into the same square.',
            ],
            [
                'name' => 'Noel B.',
                'role' => 'Youth student, age 14',
                'quote' => 'I borrow a trumpet from the lending library. I could never have afforded one on my own — the band simply handed me one and said, come back Saturday.',
            ],
            [
                'name' => 'Grace T.',
                'role' => 'Volunteer and adult beginner',
                'quote' => 'Volunteering as a librarian turned into learning the flute. Nobody here is too old or too busy to start.',
            ],
            [
                'name' => 'Ramon D.',
                'role' => 'Committee treasurer',
                'quote' => 'Every donation we get goes back into the instruments the kids hold. You can see exactly where your help lands.',
            ],
        ];

        foreach ($testimonials as $index => $testimonial) {
            Testimonial::query()->updateOrCreate(
                ['name' => $testimonial['name'], 'role' => $testimonial['role']],
                [
                    'quote' => $testimonial['quote'],
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ]
            );
        }
    }
}
