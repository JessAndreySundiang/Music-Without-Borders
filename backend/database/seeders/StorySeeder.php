<?php

namespace Database\Seeders;

use App\Models\Story;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StorySeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->stories() as $story) {
            Story::query()->updateOrCreate(
                ['slug' => Str::slug($story['title'])],
                [
                    ...$story,
                    'slug' => Str::slug($story['title']),
                    'author_name' => 'Music Without Borders',
                    'author_role' => 'Notes from the Bandstand',
                    'is_published' => false,
                    'is_sample' => true,
                    'published_at' => null,
                ],
            );
        }
    }

    /**
     * These are writing samples for the CMS demo, not real band history. They
     * stay unpublished until an administrator reviews and publishes them.
     *
     * @return array<int, array<string, mixed>>
     */
    private function stories(): array
    {
        return [
            [
                'title' => 'The Saturday the Trumpet Came Back',
                'excerpt' => 'Eduardo had not played since high school. On his first Saturday back, the band handed him a trumpet and made room.',
                'body' => "Eduardo arrived twenty minutes early, carrying a notebook and the kind of quiet nervousness that comes from returning to something you loved a long time ago. He had played trumpet in a school band in the 1980s. Life moved on, the instrument was sold, and he assumed that part of him had ended.\n\nOne of our volunteers noticed him watching from the back of the community center. She asked if he wanted to sit in. He said he was probably too rusty. She smiled, found a spare trumpet in the lending cabinet, and set it on the chair beside him. \"Rusty is fine,\" she said. \"We have polish.\"\n\nThe first notes were shaky. By the third piece, he was finding the melody again. By the end of rehearsal, two younger players had gathered around him to ask how he made a certain phrase sound so smooth. He stayed another half hour to show them.\n\nThat is what the band is for. Not perfection, not performance-ready polish. A place to come back to music, and people who will make room for you while you remember how.",
            ],
            [
                'title' => 'A Chair, a Blanket, and the Whole Barangay',
                'excerpt' => 'The monthly plaza concert began as a small rehearsal. Now neighbors bring chairs, children dance at the front, and nobody checks a ticket.',
                'body' => "The first plaza concert was supposed to be a short rehearsal in public. A handful of families came, mostly out of curiosity. Someone brought a folding chair. Someone else brought a thermos of coffee and a bag of bread to share.\n\nBy the second month, the chairs had multiplied. Grandparents arrived early to claim a spot near the front. Children ran between the trees while the band tuned. A few teenagers filmed the songs on their phones and sent them to relatives working abroad.\n\nThe music is free, and it will stay free. There is no ticket booth, no reserved seating, and no expectation that anyone knows how to behave at a concert. If a toddler dances in front of the trombones, that is part of the evening. If a lolo falls asleep halfway through a slow number, that is part of it too.\n\nWhat surprises us most is how much the concert belongs to the neighborhood now. People ask about the next date before the current one has ended. They bring friends. They bring food. They bring the kind of easy company that a barangay sometimes forgets it has.\n\nWe used to think we were giving a concert. It turns out we were mostly giving everyone a reason to sit together.",
            ],
            [
                'title' => 'From Library Volunteer to First Flute',
                'excerpt' => 'Grace came to help sort sheet music. Six months later, she was learning her first scale on a borrowed flute.',
                'body' => "Grace started volunteering because she liked organizing things. She spent her first Saturdays sorting sheet music into binders, labeling instrument cases, and keeping the lending ledger tidy. She had never played an instrument. She was not sure she was musical at all.\n\nOne afternoon, a flute teacher was short a student. Grace was asked to sit in so the lesson could continue. She held the flute the way she had seen others hold it, and made a sound that was closer to a sigh than a note. Everyone laughed, including her. The teacher said, \"Good. Now we know where to begin.\"\n\nShe came back the next week. And the week after that. She practiced in the small room behind the stage while the coffee was being made. Her first scale took a month. Her first short piece took three. She still volunteers in the library, but now she also plays in the beginner ensemble.\n\nGrace likes to tell new members that nobody here was born ready. The band is full of people who started late, started over, or started badly. The only requirement is to keep showing up.\n\nShe keeps her first practice notebook on the lending desk. Sometimes a nervous parent asks whether their child is too old to begin. Grace opens the notebook to the first page and says, \"This was me at forty-seven.\"",
            ],
        ];
    }
}
