<?php

namespace Database\Seeders;

use App\Models\AboutUsSection;
use Database\Seeders\Concerns\SeedsSections;
use Illuminate\Database\Seeder;

class AboutPageSeeder extends Seeder
{
    use SeedsSections;

    public function run(): void
    {
        $this->seedSections(AboutUsSection::class, $this->sections());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function sections(): array
    {
        return [
            [
                'key' => 'page_hero',
                'component' => 'page_hero',
                'eyebrow' => 'About us',
                'title' => "Music should be within everyone's reach.",
                'body' => "I'm Jess Andrey Sundiang, a flute and piccolo player and BSIT student. I built this site to help more families find a band where anyone can learn, borrow an instrument, and perform. Your support helps us care for instruments, provide music, and keep concerts free for our community.",
                'items' => [
                    [
                        'item_type' => 'cta',
                        'link_label' => 'Help keep music free',
                        'link_url' => '/donate',
                        'extra' => ['variant' => 'primary'],
                    ],
                    [
                        'item_type' => 'cta',
                        'link_label' => 'Visit a rehearsal',
                        'link_url' => '#join',
                        'extra' => ['variant' => 'secondary'],
                    ],
                ],
            ],
            [
                'key' => 'profile',
                'component' => 'profile',
                'eyebrow' => 'Our team',
                'title' => 'Meet the people behind the music',
                'body' => 'The people who keep our rehearsals, music library, and performances running.',
            ],
            [
                'key' => 'mission',
                'component' => 'mission',
                'eyebrow' => 'Our mission',
                'title' => 'Why we exist',
                'body' => 'To remove every barrier — cost, age, experience — that keeps people from making music, and to strengthen our community through free concerts and education.',
                'items' => [
                    [
                        'item_type' => 'pillar',
                        'title' => 'Access',
                        'body' => 'Free instrument lending, no-cost lessons, and open rehearsals ensure nobody is turned away.',
                        'icon' => 'IconKey',
                    ],
                    [
                        'item_type' => 'pillar',
                        'title' => 'Education',
                        'body' => 'Structured mentorship pairs experienced musicians with beginners for hands-on learning.',
                        'icon' => 'IconCap',
                    ],
                    [
                        'item_type' => 'pillar',
                        'title' => 'Community',
                        'body' => 'Monthly free concerts and collaborative events unite neighborhoods through shared musical experiences.',
                        'icon' => 'IconUsers',
                    ],
                ],
            ],
            [
                'key' => 'story_timeline',
                'component' => 'story_timeline',
                'eyebrow' => 'Our story',
                'title' => 'About the band',
                'body' => "Our founders were retired school band teachers and local musicians who missed playing together. They opened their rehearsals to anyone who wanted to learn, and the band has grown by word of mouth ever since.\n\nWe are registered as a non-profit and every volunteer, from conductor to librarian, gives their time for free.",
                'items' => [
                    ['item_type' => 'timeline', 'value' => '2012', 'body' => 'Founded in a parish hall with 14 members.'],
                    ['item_type' => 'timeline', 'value' => '2016', 'body' => 'Free youth lessons and the instrument lending library begin.'],
                    ['item_type' => 'timeline', 'value' => '2020', 'body' => 'Rehearsals move outdoors, and concerts are streamed for families at home.'],
                    ['item_type' => 'timeline', 'value' => '2023', 'body' => 'The Senior Ensemble opens for adults 55 and up.'],
                    ['item_type' => 'timeline', 'value' => '2026', 'body' => '45 musicians, 250 students taught, and monthly plaza concerts.'],
                ],
            ],
            [
                'key' => 'values',
                'component' => 'values',
                'eyebrow' => 'What guides us',
                'title' => 'What we stand for',
                'items' => [
                    [
                        'item_type' => 'value',
                        'title' => 'Open to all',
                        'body' => 'No audition, no fee, and no experience needed. If you want to play, there is a seat for you.',
                        'icon' => 'IconUsers',
                    ],
                    [
                        'item_type' => 'value',
                        'title' => 'Learn by playing',
                        'body' => 'We teach through rehearsal and performance, so every student plays real music from the first month.',
                        'icon' => 'IconMusic',
                    ],
                    [
                        'item_type' => 'value',
                        'title' => 'Give back',
                        'body' => 'Every concert is free, and every dollar donated goes to instruments, music, and rehearsal space.',
                        'icon' => 'IconHeart',
                    ],
                ],
            ],
            [
                'key' => 'impact',
                'component' => 'impact',
                'eyebrow' => 'Our impact',
                'title' => 'By the numbers',
                'items' => [
                    ['item_type' => 'stat', 'title' => 'Years serving Pampanga', 'value' => '14', 'icon' => 'IconCalendar'],
                    ['item_type' => 'stat', 'title' => 'Active volunteer musicians', 'value' => '45', 'icon' => 'IconMusic'],
                    ['item_type' => 'stat', 'title' => 'Students taught to date', 'value' => '250+', 'icon' => 'IconCap'],
                    ['item_type' => 'stat', 'title' => 'Free concerts every year', 'value' => '30+', 'icon' => 'IconHeart'],
                    ['item_type' => 'stat', 'title' => 'Instruments in lending library', 'value' => '60', 'icon' => 'IconInstrument'],
                    ['item_type' => 'stat', 'title' => 'Cost to join or attend', 'value' => '₱0', 'icon' => 'IconTicket'],
                ],
            ],
            [
                'key' => 'faq',
                'component' => 'faq',
                'eyebrow' => 'Common questions',
                'title' => 'Frequently asked questions',
                'items' => [
                    [
                        'item_type' => 'faq',
                        'title' => 'Do I need to own an instrument?',
                        'body' => 'No. Our instrument lending library has over 60 instruments available for free long-term loan to any active member.',
                    ],
                    [
                        'item_type' => 'faq',
                        'title' => 'Is there an age limit?',
                        'body' => 'We welcome everyone from age 8 to 80+. Youth lessons start at 8, and the Senior Ensemble is open to adults 55 and up.',
                    ],
                    [
                        'item_type' => 'faq',
                        'title' => "What if I've never played before?",
                        'body' => 'Perfect — about half our members started as complete beginners. We pair new players with experienced mentors from day one.',
                    ],
                    [
                        'item_type' => 'faq',
                        'title' => 'Is there a membership fee?',
                        'body' => 'Never. Everything — rehearsals, lessons, instruments, and concerts — is completely free. We are funded by voluntary donations.',
                    ],
                    [
                        'item_type' => 'faq',
                        'title' => 'How much time do I need to commit?',
                        'body' => 'Saturday rehearsals run from 9:00 AM to 12:00 NN. Come when you can — there is no attendance requirement.',
                    ],
                ],
            ],
            [
                'key' => 'join',
                'component' => 'join',
                'eyebrow' => 'Come and see',
                'title' => 'Join a rehearsal',
                'body' => 'Come to any Saturday rehearsal in Pandacaqui. You can watch first, or sit in and play.',
                'extra' => ['cta_label' => 'Call'],
                'items' => [
                    [
                        'item_type' => 'detail',
                        'title' => 'When',
                        'body' => 'Saturdays, 9:00 AM to 12:00 NN',
                        'icon' => 'IconCalendar',
                    ],
                    [
                        'item_type' => 'detail',
                        'title' => 'Where',
                        'body' => 'Pandacaqui Community Center, Mexico, Pampanga, Philippines',
                        'icon' => 'IconMapPin',
                    ],
                    [
                        'item_type' => 'detail',
                        'title' => 'Cost',
                        'body' => 'Free',
                        'icon' => 'IconHeart',
                    ],
                    [
                        'item_type' => 'detail',
                        'title' => 'Bring',
                        'body' => 'Your instrument, or borrow one from us',
                        'icon' => 'IconClock',
                    ],
                ],
            ],
        ];
    }
}
