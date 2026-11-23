<?php

namespace Tests\Feature;

use App\Mail\StorySubmissionAlert;
use App\Mail\StorySubmittedConfirmation;
use App\Models\Story;
use App\Models\StoryModerationEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StorySubmissionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_valid_submission_is_stored_as_pending_and_kept_private(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/stories/submissions', $this->payload())
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Thank you. Your story was received and is waiting for review.',
            )
            ->assertJsonMissingPath('data');

        $this->assertNotNull($response->json('reference_code'));
        $this->assertStringStartsWith('MWB-', $response->json('reference_code'));

        $this->assertDatabaseCount('stories', 1);
        $this->assertDatabaseHas('stories', [
            'title' => 'A Story from the Plaza',
            'slug' => 'a-story-from-the-plaza',
            'author_email' => 'reader@example.com',
            'status' => Story::STATUS_PENDING,
            'published_at' => null,
            'is_sample' => false,
        ]);

        $story = Story::query()->firstOrFail();
        $this->assertNotNull($story->consent_at);
        $this->assertNotNull($story->excerpt);
        $this->assertLessThanOrEqual(183, mb_strlen($story->excerpt));

        // Audit trail
        $this->assertDatabaseHas('story_moderation_events', [
            'story_id' => $story->id,
            'action' => StoryModerationEvent::ACTION_SUBMITTED,
            'actor_id' => null,
        ]);

        // Email notifications
        Mail::assertSent(StorySubmittedConfirmation::class, function (StorySubmittedConfirmation $mail) use ($story) {
            return $mail->hasTo('reader@example.com') && $mail->story->id === $story->id;
        });

        Mail::assertSent(StorySubmissionAlert::class, function (StorySubmissionAlert $mail) use ($story) {
            return $mail->hasTo(config('mail.story_admin_email')) && $mail->story->id === $story->id;
        });

        $this->getJson('/api/stories')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/stories/a-story-from-the-plaza')->assertNotFound();
        $this->assertStringNotContainsString('reader@example.com', $response->getContent());
    }

    public function test_duplicate_submission_within_24_hours_from_same_email_is_rejected(): void
    {
        Mail::fake();

        $this->postJson('/api/stories/submissions', $this->payload())->assertCreated();

        // Duplicate submission with same title and email
        $this->postJson('/api/stories/submissions', $this->payload([
            'author_email' => 'READER@example.com',
            'title' => '  A Story from the Plaza  ',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');

        // Different title is allowed
        $this->postJson('/api/stories/submissions', $this->payload([
            'title' => 'A Different Story from the Plaza',
        ]))->assertCreated();

        $this->assertDatabaseCount('stories', 2);
    }

    public function test_optional_cover_image_url_accepts_valid_https_url_and_rejects_insecure_urls(): void
    {
        Mail::fake();

        // Valid HTTPS URL
        $this->postJson('/api/stories/submissions', $this->payload([
            'cover_image_url' => 'https://images.example.com/photos/plaza.jpg',
        ]))->assertCreated();

        $this->assertDatabaseHas('stories', [
            'cover_image_url' => 'https://images.example.com/photos/plaza.jpg',
        ]);

        // Insecure HTTP URL rejected
        $this->postJson('/api/stories/submissions', $this->payload([
            'title' => 'Another Story With HTTP',
            'cover_image_url' => 'http://images.example.com/photos/insecure.jpg',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cover_image_url');
    }

    public function test_a_submission_requires_explicit_consent(): void
    {
        $this->postJson('/api/stories/submissions', $this->payload(['consent' => false]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('consent');

        $this->assertDatabaseCount('stories', 0);
    }

    public function test_a_submission_requires_a_body_of_at_least_200_characters(): void
    {
        $this->postJson('/api/stories/submissions', $this->payload(['body' => 'Too short.']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');

        $this->assertDatabaseCount('stories', 0);
    }

    public function test_a_submission_requires_a_valid_email_address(): void
    {
        $this->postJson('/api/stories/submissions', $this->payload(['author_email' => 'not-an-email']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('author_email');

        $this->assertDatabaseCount('stories', 0);
    }

    public function test_a_submission_validates_title_name_and_role_lengths(): void
    {
        $this->postJson('/api/stories/submissions', $this->payload([
            'title' => 'Hey',
            'author_name' => 'A',
            'author_role' => str_repeat('x', 101),
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'author_name', 'author_role']);

        $this->assertDatabaseCount('stories', 0);
    }

    public function test_a_filled_honeypot_is_rejected_without_storing_the_story(): void
    {
        $this->postJson('/api/stories/submissions', $this->payload([
            'website' => 'https://spam.example.com',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('website');

        $this->assertDatabaseCount('stories', 0);
    }

    public function test_the_public_payload_cannot_mass_assign_moderation_fields(): void
    {
        $this->postJson('/api/stories/submissions', $this->payload([
            'status' => Story::STATUS_APPROVED,
            'published_at' => now()->toIso8601String(),
            'reviewed_by' => 1,
            'reviewed_at' => now()->toIso8601String(),
            'rejection_reason' => 'Not applicable',
            'is_published' => true,
            'is_sample' => true,
        ]))->assertCreated();

        $this->assertDatabaseHas('stories', [
            'status' => Story::STATUS_PENDING,
            'published_at' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'rejection_reason' => null,
            'is_sample' => false,
        ]);
    }

    public function test_slugs_are_unique_and_emails_are_normalized(): void
    {
        $this->postJson('/api/stories/submissions', $this->payload())->assertCreated();
        $this->postJson('/api/stories/submissions', $this->payload([
            'title' => 'Different Title But Same Normalize',
            'author_email' => 'SECOND@EXAMPLE.COM',
        ]))->assertCreated();

        $this->assertDatabaseHas('stories', ['slug' => 'a-story-from-the-plaza']);
        $this->assertDatabaseHas('stories', ['author_email' => 'second@example.com']);
    }

    public function test_the_fourth_submission_from_one_address_within_an_hour_is_throttled(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.42']);

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->postJson('/api/stories/submissions', $this->payload([
                'title' => 'Throttle Test Story '.$attempt,
            ]))->assertCreated();
        }

        $this->postJson('/api/stories/submissions', $this->payload([
            'title' => 'Throttle Test Story 4',
        ]))->assertStatus(429);

        $this->assertDatabaseCount('stories', 3);
    }

    public function test_submission_accepts_valid_category_and_rejects_invalid_category(): void
    {
        $this->postJson('/api/stories/submissions', $this->payload([
            'title' => 'Concert Story',
            'category' => Story::CATEGORY_CONCERT,
        ]))->assertCreated();

        $this->assertSame(Story::CATEGORY_CONCERT, Story::where('title', 'Concert Story')->first()->category);

        $this->postJson('/api/stories/submissions', $this->payload([
            'title' => 'Invalid Category Story',
            'category' => 'invalid-category',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('category');
    }

    public function test_author_can_check_submission_status_using_reference_code(): void
    {
        $response = $this->postJson('/api/stories/submissions', $this->payload([
            'title' => 'Status Check Story',
            'category' => Story::CATEGORY_REHEARSAL,
        ]))->assertCreated();

        $refCode = $response->json('reference_code');
        $this->assertNotEmpty($refCode);

        // Status lookup for pending story
        $statusResp = $this->getJson('/api/stories/status/'.$refCode)
            ->assertOk()
            ->assertJsonPath('data.reference_code', $refCode)
            ->assertJsonPath('data.title', 'Status Check Story')
            ->assertJsonPath('data.status', Story::STATUS_PENDING)
            ->assertJsonPath('data.category', Story::CATEGORY_REHEARSAL)
            ->assertJsonPath('data.rejection_reason', null);

        // Privacy check: Never returns author_email or body
        $this->assertArrayNotHasKey('author_email', $statusResp->json('data'));
        $this->assertArrayNotHasKey('body', $statusResp->json('data'));

        // Unknown reference code returns 404
        $this->getJson('/api/stories/status/MWB-NOTFOUND')->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'A Story from the Plaza',
            'author_name' => 'Reader Name',
            'author_email' => 'Reader@Example.COM',
            'author_role' => 'Audience member',
            'body' => str_repeat('The band played in the plaza and the neighbors sang along. ', 5),
            'consent' => true,
            'website' => '',
        ], $overrides);
    }
}
