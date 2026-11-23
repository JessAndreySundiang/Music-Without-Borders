<?php

namespace Tests\Feature;

use App\Mail\StoryApprovedNotification;
use App\Mail\StoryRejectedNotification;
use App\Models\Story;
use App\Models\StoryModerationEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoryModerationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_admin_queue_filters_by_status_and_returns_counts_and_private_fields(): void
    {
        Sanctum::actingAs($this->admin());

        $this->story(['status' => Story::STATUS_PENDING, 'author_email' => 'pending-one@example.com']);
        $this->story(['status' => Story::STATUS_PENDING, 'author_email' => 'pending-two@example.com']);
        $this->story(['status' => Story::STATUS_DRAFT]);
        $this->story(['status' => Story::STATUS_APPROVED]);
        $this->story(['status' => Story::STATUS_REJECTED]);

        $all = $this->getJson('/api/admin/stories')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.counts.all', 5)
            ->assertJsonPath('meta.counts.pending', 2)
            ->assertJsonPath('meta.counts.draft', 1)
            ->assertJsonPath('meta.counts.approved', 1)
            ->assertJsonPath('meta.counts.rejected', 1);

        $this->assertArrayHasKey('author_email', $all->json('data.0'));
        $this->assertArrayHasKey('status', $all->json('data.0'));

        $pending = $this->getJson('/api/admin/stories?status=pending')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.counts.all', 5);

        foreach ($pending->json('data') as $story) {
            $this->assertSame(Story::STATUS_PENDING, $story['status']);
        }

        $this->getJson('/api/admin/stories?status=bogus')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_approving_a_pending_story_publishes_it_with_review_metadata_and_sends_notification(): void
    {
        Mail::fake();

        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $story = $this->story([
            'title' => 'The Plaza Choir',
            'slug' => 'the-plaza-choir',
            'status' => Story::STATUS_PENDING,
            'author_email' => 'private-author@example.com',
            'consent_at' => now(),
        ]);

        $response = $this->postJson('/api/admin/stories/'.$story->id.'/approve')
            ->assertOk()
            ->assertJsonPath('data.status', Story::STATUS_APPROVED)
            ->assertJsonPath('data.reviewed_by', $admin->id)
            ->assertJsonPath('data.reviewer_name', $admin->name)
            ->assertJsonPath('data.author_email', 'private-author@example.com')
            ->assertJsonPath('data.rejection_reason', null);

        // Audit trail recorded and returned
        $this->assertDatabaseHas('story_moderation_events', [
            'story_id' => $story->id,
            'action' => StoryModerationEvent::ACTION_APPROVED,
            'actor_id' => $admin->id,
        ]);

        $this->assertCount(1, $response->json('data.events'));
        $this->assertSame('approved', $response->json('data.events.0.action'));
        $this->assertSame($admin->name, $response->json('data.events.0.actor_name'));

        // Email notification sent
        Mail::assertSent(StoryApprovedNotification::class, function (StoryApprovedNotification $mail) use ($story) {
            return $mail->hasTo('private-author@example.com') && $mail->story->id === $story->id;
        });

        $fresh = $story->fresh();
        $this->assertNotNull($fresh->published_at);
        $this->assertNotNull($fresh->reviewed_at);

        $this->getJson('/api/stories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'the-plaza-choir');

        $detail = $this->getJson('/api/stories/the-plaza-choir')
            ->assertOk()
            ->assertJsonPath('data.title', 'The Plaza Choir')
            ->assertDontSee('private-author@example.com');

        $this->assertArrayNotHasKey('author_email', $detail->json('data'));
        $this->assertArrayNotHasKey('status', $detail->json('data'));
        $this->assertArrayNotHasKey('reviewed_by', $detail->json('data'));
        $this->assertArrayNotHasKey('reviewed_at', $detail->json('data'));
        $this->assertArrayNotHasKey('rejection_reason', $detail->json('data'));
        $this->assertArrayNotHasKey('consent_at', $detail->json('data'));
        $this->assertArrayNotHasKey('events', $detail->json('data'));
    }

    public function test_rejection_requires_a_reason_keeps_the_story_private_and_sends_notification(): void
    {
        Mail::fake();

        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $story = $this->story([
            'title' => 'A Story to Decline',
            'slug' => 'a-story-to-decline',
            'status' => Story::STATUS_PENDING,
            'author_email' => 'declined@example.com',
        ]);

        $this->postJson('/api/admin/stories/'.$story->id.'/reject', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rejection_reason');

        $this->assertSame(Story::STATUS_PENDING, $story->fresh()->status);
        Mail::assertNothingSent();

        $response = $this->postJson('/api/admin/stories/'.$story->id.'/reject', [
            'rejection_reason' => 'Insufficient detail for a public story.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', Story::STATUS_REJECTED)
            ->assertJsonPath('data.rejection_reason', 'Insufficient detail for a public story.')
            ->assertJsonPath('data.reviewed_by', $admin->id)
            ->assertJsonPath('data.published_at', null);

        // Audit trail recorded
        $this->assertDatabaseHas('story_moderation_events', [
            'story_id' => $story->id,
            'action' => StoryModerationEvent::ACTION_REJECTED,
            'actor_id' => $admin->id,
            'reason' => 'Insufficient detail for a public story.',
        ]);

        $this->assertSame('rejected', $response->json('data.events.0.action'));
        $this->assertSame('Insufficient detail for a public story.', $response->json('data.events.0.reason'));

        // Rejection notification sent
        Mail::assertSent(StoryRejectedNotification::class, function (StoryRejectedNotification $mail) use ($story) {
            return $mail->hasTo('declined@example.com') &&
                   $mail->story->id === $story->id &&
                   $mail->reason === 'Insufficient detail for a public story.';
        });

        $fresh = $story->fresh();
        $this->assertNull($fresh->published_at);
        $this->assertNotNull($fresh->reviewed_at);

        $this->getJson('/api/stories')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/stories/a-story-to-decline')->assertNotFound();
        $this->getJson('/api/admin/stories?status=rejected')
            ->assertOk()
            ->assertJsonPath('data.0.rejection_reason', 'Insufficient detail for a public story.');
    }

    public function test_a_rejected_story_can_be_reopened_and_remains_private(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $story = $this->story([
            'slug' => 'reopen-me',
            'status' => Story::STATUS_REJECTED,
            'rejection_reason' => 'Privacy concern.',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $response = $this->postJson('/api/admin/stories/'.$story->id.'/reopen')
            ->assertOk()
            ->assertJsonPath('data.status', Story::STATUS_PENDING)
            ->assertJsonPath('data.reviewed_by', null)
            ->assertJsonPath('data.reviewed_at', null)
            ->assertJsonPath('data.rejection_reason', 'Privacy concern.');

        // Audit event recorded
        $this->assertDatabaseHas('story_moderation_events', [
            'story_id' => $story->id,
            'action' => StoryModerationEvent::ACTION_REOPENED,
            'actor_id' => $admin->id,
        ]);

        $this->assertSame('reopened', $response->json('data.events.0.action'));

        $this->getJson('/api/stories/reopen-me')->assertNotFound();
    }

    public function test_invalid_status_transitions_are_rejected(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $rejected = $this->story(['status' => Story::STATUS_REJECTED]);
        $approved = $this->story(['status' => Story::STATUS_APPROVED]);
        $pending = $this->story(['status' => Story::STATUS_PENDING]);

        $this->postJson('/api/admin/stories/'.$rejected->id.'/approve')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->postJson('/api/admin/stories/'.$approved->id.'/reject', [
            'rejection_reason' => 'This should not be accepted.',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->postJson('/api/admin/stories/'.$pending->id.'/reopen')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertSame(Story::STATUS_REJECTED, $rejected->fresh()->status);
        $this->assertSame(Story::STATUS_APPROVED, $approved->fresh()->status);
        $this->assertSame(Story::STATUS_PENDING, $pending->fresh()->status);
    }

    public function test_moderation_requires_an_authenticated_admin(): void
    {
        $story = $this->story(['status' => Story::STATUS_PENDING]);

        $this->postJson('/api/admin/stories/'.$story->id.'/approve')->assertUnauthorized();

        $regularUser = User::query()->create([
            'name' => 'Regular User',
            'email' => 'regular@example.com',
            'password' => Hash::make('correct-password'),
            'is_admin' => false,
        ]);

        Sanctum::actingAs($regularUser);

        $this->postJson('/api/admin/stories/'.$story->id.'/approve')->assertForbidden();
        $this->postJson('/api/admin/stories/'.$story->id.'/reject', [
            'rejection_reason' => 'Not allowed.',
        ])->assertForbidden();

        $this->assertSame(Story::STATUS_PENDING, $story->fresh()->status);
    }

    public function test_admin_can_feature_and_unfeature_an_approved_story_with_single_featured_guarantee(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $story1 = $this->story(['status' => Story::STATUS_APPROVED, 'published_at' => now()]);
        $story2 = $this->story(['status' => Story::STATUS_APPROVED, 'published_at' => now()]);

        // Feature first story
        $this->postJson('/api/admin/stories/'.$story1->id.'/feature')
            ->assertOk()
            ->assertJsonPath('data.is_featured', true);

        $this->assertTrue($story1->fresh()->is_featured);
        $this->assertFalse($story2->fresh()->is_featured);

        // Feature second story -> first story automatically unfeatures
        $this->postJson('/api/admin/stories/'.$story2->id.'/feature')
            ->assertOk()
            ->assertJsonPath('data.is_featured', true);

        $this->assertFalse($story1->fresh()->is_featured);
        $this->assertTrue($story2->fresh()->is_featured);

        // Unfeature second story
        $this->postJson('/api/admin/stories/'.$story2->id.'/unfeature')
            ->assertOk()
            ->assertJsonPath('data.is_featured', false);

        $this->assertFalse($story2->fresh()->is_featured);
        $this->assertSame(0, Story::where('is_featured', true)->count());
    }

    public function test_only_approved_stories_can_be_featured(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $draft = $this->story(['status' => Story::STATUS_DRAFT]);
        $pending = $this->story(['status' => Story::STATUS_PENDING]);
        $rejected = $this->story(['status' => Story::STATUS_REJECTED]);

        $this->postJson('/api/admin/stories/'.$draft->id.'/feature')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->postJson('/api/admin/stories/'.$pending->id.'/feature')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->postJson('/api/admin/stories/'.$rejected->id.'/feature')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertFalse($draft->fresh()->is_featured);
        $this->assertFalse($pending->fresh()->is_featured);
        $this->assertFalse($rejected->fresh()->is_featured);
    }

    public function test_public_stories_endpoints_expose_is_featured_flag(): void
    {
        $story = $this->story([
            'status' => Story::STATUS_APPROVED,
            'is_featured' => true,
            'published_at' => now(),
        ]);

        $list = $this->getJson('/api/stories')->assertOk();
        $this->assertTrue($list->json('data.0.is_featured'));

        $detail = $this->getJson('/api/stories/'.$story->slug)->assertOk();
        $this->assertTrue($detail->json('data.is_featured'));
    }

    private function story(array $overrides = []): Story
    {
        return Story::query()->create(array_merge([
            'title' => 'Story',
            'slug' => 'story-'.Str::lower(Str::random(8)),
            'excerpt' => 'Excerpt',
            'body' => 'Body',
            'author_name' => 'Reader Name',
            'status' => Story::STATUS_DRAFT,
            'is_sample' => true,
        ], $overrides));
    }

    private function admin(): User
    {
        return User::query()->create([
            'name' => 'Moderation Admin',
            'email' => 'moderation-admin@example.com',
            'password' => Hash::make('correct-password'),
            'is_admin' => true,
        ]);
    }
}
