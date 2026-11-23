<?php

namespace Database\Seeders;

use App\Models\Story;
use App\Models\StoryModerationEvent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo submissions for the moderation queue. They are marked as samples and
 * stay private until an administrator approves them.
 */
class StorySubmissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->submissions() as $data) {
            $events = $data['events'] ?? [];
            unset($data['events']);

            $story = Story::query()->updateOrCreate(
                ['slug' => Str::slug($data['title'])],
                [
                    ...$data,
                    'slug' => Str::slug($data['title']),
                    'is_sample' => true,
                    'published_at' => null,
                ],
            );

            // Seed moderation audit trail
            $story->moderationEvents()->delete();
            foreach ($events as $eventData) {
                $story->moderationEvents()->create($eventData);
            }
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function submissions(): array
    {
        return [
            [
                'title' => 'The Night the Plaza Learned a New Song',
                'excerpt' => 'A neighbor asked whether we could teach the chorus to everyone before the next plaza concert. We tried.',
                'body' => "A neighbor stopped us after rehearsal and asked whether the whole plaza could learn one chorus before the next concert. Not a performance, she said. Just something everyone could sing together.\n\nWe printed the words in large type and handed them out at the next rehearsal. A few teenagers learned the harmony first. Then a grandmother asked for a copy for her grandson, and a tricycle driver practiced the melody between fares. By the night of the concert, half the audience knew when to come in.\n\nIt was not perfect. Some people started early, some started late, and one child sang the last line with tremendous confidence in the wrong key. Nobody minded. The plaza has never sounded more like a room full of neighbors.",
                'author_name' => 'Mara Dela Cruz',
                'author_email' => 'mara.sample@example.com',
                'author_role' => 'Audience member',
                'category' => Story::CATEGORY_COMMUNITY,
                'cover_image_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
                'status' => Story::STATUS_PENDING,
                'consent_at' => now()->subDays(2),
                'reviewed_by' => null,
                'reviewed_at' => null,
                'rejection_reason' => null,
                'sort_order' => 0,
                'events' => [
                    [
                        'action' => StoryModerationEvent::ACTION_SUBMITTED,
                        'actor_id' => null,
                        'reason' => null,
                        'created_at' => now()->subDays(2),
                    ],
                ],
            ],
            [
                'title' => 'A Clarinet Case Full of Index Cards',
                'excerpt' => 'Inside an old clarinet case, a volunteer found decades of handwritten practice notes from former members.',
                'body' => "While cleaning the lending cabinet, a volunteer opened a clarinet case that had not been used in years. Instead of reeds, it was full of index cards. Each card held a short note in careful handwriting: a fingering reminder, a breathing exercise, the first line of a song.\n\nWe do not know who wrote most of them. A few cards are signed with initials and dates from the 1990s. One says, simply, \"Do not rush the ending.\" Another has a small drawing of a music stand and a cup of coffee.\n\nWe have started using the cards during beginner lessons. They are a reminder that the band has been teaching people to begin for a long time, and that the small things someone writes down can help a stranger years later.",
                'author_name' => 'Jun Santos',
                'author_email' => 'jun.sample@example.com',
                'author_role' => 'Volunteer',
                'category' => Story::CATEGORY_LENDING_LIBRARY,
                'cover_image_url' => null,
                'status' => Story::STATUS_PENDING,
                'consent_at' => now()->subDay(),
                'reviewed_by' => null,
                'reviewed_at' => null,
                'rejection_reason' => null,
                'sort_order' => 0,
                'events' => [
                    [
                        'action' => StoryModerationEvent::ACTION_SUBMITTED,
                        'actor_id' => null,
                        'reason' => null,
                        'created_at' => now()->subDay(),
                    ],
                ],
            ],
            [
                'title' => 'A Story Without Enough Detail',
                'excerpt' => 'A short demo submission used to show the rejected state in the moderation queue.',
                'body' => "This is sample data for the moderation demo. It represents a submission that an administrator reviewed and declined because it did not include enough detail about the music or community event.\n\nThe story remains private. It is not returned by the public stories list and its detail URL returns 404. The rejection reason is visible only in the admin queue.",
                'author_name' => 'Sample Submitter',
                'author_email' => 'rejected.sample@example.com',
                'author_role' => 'Audience member',
                'category' => Story::CATEGORY_CONCERT,
                'cover_image_url' => null,
                'status' => Story::STATUS_REJECTED,
                'consent_at' => now()->subDays(4),
                'reviewed_by' => null,
                'reviewed_at' => now()->subDays(3),
                'rejection_reason' => 'Insufficient detail: the submission did not include enough context about the music or community event.',
                'sort_order' => 0,
                'events' => [
                    [
                        'action' => StoryModerationEvent::ACTION_SUBMITTED,
                        'actor_id' => null,
                        'reason' => null,
                        'created_at' => now()->subDays(4),
                    ],
                    [
                        'action' => StoryModerationEvent::ACTION_REJECTED,
                        'actor_id' => null,
                        'reason' => 'Insufficient detail: the submission did not include enough context about the music or community event.',
                        'created_at' => now()->subDays(3),
                    ],
                ],
            ],
        ];
    }
}
