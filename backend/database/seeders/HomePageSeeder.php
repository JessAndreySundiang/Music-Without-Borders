<?php

namespace Database\Seeders;

use App\Models\HomeSection;
use Database\Seeders\Concerns\SeedsSections;
use Illuminate\Database\Seeder;

class HomePageSeeder extends Seeder
{
    use SeedsSections;

    public function run(): void
    {
        $this->seedSections(HomeSection::class, $this->sections());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function sections(): array
    {
        return [
            [
                'key' => 'hero',
                'component' => 'hero',
                'eyebrow' => 'A volunteer band for every neighbor',
                'title' => 'Music that belongs to everyone.',
                'body' => 'Free to learn, free to listen, and open to every age and skill level. Local musicians making room for more music in our community.',
                'items' => [
                    [
                        'item_type' => 'cta',
                        'link_label' => 'Join a rehearsal',
                        'link_url' => '/about',
                        'extra' => ['variant' => 'primary'],
                    ],
                    [
                        'item_type' => 'cta',
                        'link_label' => 'Find a concert',
                        'link_url' => '#events',
                        'extra' => ['variant' => 'secondary'],
                    ],
                    ['item_type' => 'trust_point', 'title' => 'No auditions'],
                    ['item_type' => 'trust_point', 'title' => 'No fees, ever'],
                    ['item_type' => 'trust_point', 'title' => 'Instruments to borrow'],
                    [
                        'item_type' => 'metric',
                        'title' => 'Year we started',
                        'value' => '2012',
                        'icon' => 'IconCalendar',
                    ],
                    [
                        'item_type' => 'metric',
                        'title' => 'Volunteer musicians',
                        'value' => '45',
                        'icon' => 'IconUsers',
                    ],
                    [
                        'item_type' => 'metric',
                        'title' => 'Free concerts every year',
                        'value' => '30+',
                        'icon' => 'IconMusic',
                    ],
                    [
                        'item_type' => 'metric',
                        'title' => 'Students taught',
                        'value' => '250',
                        'icon' => 'IconCap',
                    ],
                ],
            ],
            [
                'key' => 'mission',
                'component' => 'mission',
                'eyebrow' => 'Our mission',
                'title' => 'Music should not depend on what a family can afford.',
                'body' => "We started in a parish hall because too many children in our town never got the chance to hold an instrument. Today our volunteer teachers run lessons, lend out instruments, and play free concerts for the whole community.\n\nEvery dollar we raise goes to instruments, sheet music, and rehearsal space.",
                'items' => [
                    [
                        'item_type' => 'feature_card',
                        'title' => 'Free to learn. Free to listen. Free to join.',
                        'body' => 'Run by volunteers, funded by donations and local sponsors.',
                    ],
                ],
            ],
            [
                'key' => 'programs',
                'component' => 'programs',
                'eyebrow' => 'What we offer',
                'title' => 'Three programs, all free.',
                'body' => 'Every program is run by band volunteers, and every one of them is open to anyone who walks through the door.',
                'items' => [
                    [
                        'item_type' => 'program',
                        'title' => 'Youth Music Lessons',
                        'body' => 'Weekly group lessons in brass, woodwind, and percussion. Families who cannot buy an instrument can borrow one from our lending library.',
                        'value' => 'Ages 8 to 17',
                        'icon' => 'IconCap',
                    ],
                    [
                        'item_type' => 'program',
                        'title' => 'Community Concerts',
                        'body' => 'A free outdoor concert in the town plaza on the second Sunday of every month. Bring a chair, a blanket, and your neighbors.',
                        'value' => 'All ages',
                        'icon' => 'IconMusic',
                    ],
                    [
                        'item_type' => 'program',
                        'title' => 'Senior Ensemble',
                        'body' => 'A relaxed Saturday-afternoon group for adults who want to keep playing or finally learn. No audition needed.',
                        'value' => 'Ages 55 and up',
                        'icon' => 'IconHeart',
                    ],
                ],
            ],
            [
                'key' => 'events',
                'component' => 'events',
                'eyebrow' => 'Upcoming',
                'title' => '2026 Concerts & Performances',
                'body' => 'Every event is free and open to the neighbourhood — no tickets and no sign-up, just come along.',
                'extra' => [
                    'notice' => "Sample schedule for the CMS demo. Replace these dates and details with the band's real 2026 events.",
                ],
                'items' => [
                    [
                        'item_type' => 'cta',
                        'link_label' => 'View All 2026 Season',
                        'link_url' => '/performances',
                        'extra' => ['variant' => 'secondary'],
                    ],
                ],
            ],
            [
                'key' => 'testimonials',
                'component' => 'testimonials',
                'eyebrow' => 'Voices',
                'title' => 'Why families keep coming back',
                'body' => 'Everyone who plays here started somewhere. Here is what the band means to the people in it.',
            ],
            [
                'key' => 'cta',
                'component' => 'cta',
                'title' => 'Play with us, or help us buy the next trumpet.',
                'body' => 'New members join all year. Donations and sponsors keep every lesson and concert free.',
                'items' => [
                    [
                        'item_type' => 'cta',
                        'link_label' => 'See how to join',
                        'link_url' => '/about',
                        'extra' => ['variant' => 'secondary'],
                    ],
                    [
                        'item_type' => 'cta',
                        'link_label' => 'Donate now',
                        'link_url' => '/donate',
                        'icon' => 'IconHeart',
                        'extra' => ['variant' => 'primary'],
                    ],
                ],
            ],
        ];
    }
}
