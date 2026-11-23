<?php

namespace Tests\Feature;

use App\Models\Story;
use App\Models\User;
use Database\Seeders\StorySeeder;
use Database\Seeders\StorySubmissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoriesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_public_story_list_only_returns_approved_stories(): void
    {
        $approved = $this->story([
            'title' => 'A Saturday to Remember',
            'slug' => 'a-saturday-to-remember',
            'status' => Story::STATUS_APPROVED,
            'published_at' => now(),
        ]);
        $this->story([
            'title' => 'Still a Draft',
            'slug' => 'still-a-draft',
            'status' => Story::STATUS_DRAFT,
        ]);
        $this->story([
            'title' => 'Waiting for Review',
            'slug' => 'waiting-for-review',
            'status' => Story::STATUS_PENDING,
        ]);
        $this->story([
            'title' => 'Not Accepted',
            'slug' => 'not-accepted',
            'status' => Story::STATUS_REJECTED,
        ]);

        $this->getJson('/api/stories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $approved->id)
            ->assertJsonPath('data.0.slug', 'a-saturday-to-remember');
    }

    public function test_only_approved_stories_can_be_opened_by_slug(): void
    {
        $this->story([
            'title' => 'The Trumpet Came Back',
            'slug' => 'the-trumpet-came-back',
            'status' => Story::STATUS_APPROVED,
            'published_at' => now(),
        ]);
        $this->story([
            'title' => 'Draft Story',
            'slug' => 'draft-story',
            'status' => Story::STATUS_DRAFT,
        ]);
        $this->story([
            'title' => 'Pending Story',
            'slug' => 'pending-story',
            'status' => Story::STATUS_PENDING,
        ]);
        $this->story([
            'title' => 'Rejected Story',
            'slug' => 'rejected-story',
            'status' => Story::STATUS_REJECTED,
        ]);

        $this->getJson('/api/stories/the-trumpet-came-back')
            ->assertOk()
            ->assertJsonPath('data.title', 'The Trumpet Came Back');

        $this->getJson('/api/stories/draft-story')->assertNotFound();
        $this->getJson('/api/stories/pending-story')->assertNotFound();
        $this->getJson('/api/stories/rejected-story')->assertNotFound();
    }

    public function test_the_approved_launch_stories_are_seeded_as_approved_and_not_samples(): void
    {
        $this->seed(StorySeeder::class);

        $this->assertSame(3, Story::query()->approved()->count());
        $this->assertSame(0, Story::query()->where('is_sample', true)->count());
        $this->assertDatabaseHas('stories', [
            'slug' => 'the-saturday-the-trumpet-came-back',
            'status' => Story::STATUS_APPROVED,
            'is_sample' => false,
        ]);
    }

    public function test_the_demo_submission_seeder_creates_pending_and_rejected_samples(): void
    {
        $this->seed(StorySubmissionSeeder::class);

        $this->assertSame(2, Story::query()->where('status', Story::STATUS_PENDING)->count());
        $this->assertSame(1, Story::query()->where('status', Story::STATUS_REJECTED)->count());
        $this->assertSame(3, Story::query()->where('is_sample', true)->count());
        $this->assertSame(0, Story::query()->approved()->count());

        $this->getJson('/api/stories')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_an_admin_can_create_update_and_soft_delete_a_story(): void
    {
        Sanctum::actingAs($this->admin());

        $created = $this->postJson('/api/admin/stories', [
            'title' => 'A New Note',
            'excerpt' => 'A short excerpt.',
            'body' => "First paragraph.\n\nSecond paragraph.",
            'author_name' => 'Music Without Borders',
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'a-new-note')
            ->assertJsonPath('data.status', Story::STATUS_DRAFT)
            ->assertJsonPath('data.published_at', null);

        $id = $created->json('data.id');

        $this->putJson('/api/admin/stories/'.$id, [
            'title' => 'A New Note, Revised',
            'excerpt' => 'A short excerpt.',
            'body' => 'Revised body.',
            'is_sample' => false,
            // These are not part of the content payload and must be ignored.
            'status' => Story::STATUS_APPROVED,
            'published_at' => now()->toIso8601String(),
        ])->assertOk()
            ->assertJsonPath('data.slug', 'a-new-note')
            ->assertJsonPath('data.status', Story::STATUS_DRAFT)
            ->assertJsonPath('data.published_at', null);

        $this->assertDatabaseHas('stories', [
            'id' => $id,
            'status' => Story::STATUS_DRAFT,
            'published_at' => null,
        ]);

        $this->deleteJson('/api/admin/stories/'.$id)->assertOk();
        $this->assertSoftDeleted('stories', ['id' => $id]);
    }

    public function test_the_public_story_list_can_be_filtered_by_category(): void
    {
        $concert = $this->story([
            'title' => 'Concert Story',
            'status' => Story::STATUS_APPROVED,
            'category' => Story::CATEGORY_CONCERT,
            'published_at' => now(),
        ]);
        $rehearsal = $this->story([
            'title' => 'Rehearsal Story',
            'status' => Story::STATUS_APPROVED,
            'category' => Story::CATEGORY_REHEARSAL,
            'published_at' => now(),
        ]);

        $all = $this->getJson('/api/stories')->assertOk();
        $this->assertCount(2, $all->json('data'));

        $concertOnly = $this->getJson('/api/stories?category=concert')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $concert->id);

        $rehearsalOnly = $this->getJson('/api/stories?category=rehearsal')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $rehearsal->id);

        $emptyCategory = $this->getJson('/api/stories?category=lending-library')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    private function story(array $overrides = []): Story
    {
        return Story::query()->create(array_merge([
            'title' => 'Story',
            'slug' => 'story-'.Str::lower(Str::random(8)),
            'excerpt' => 'Excerpt',
            'body' => 'Body',
            'author_name' => 'Music Without Borders',
            'status' => Story::STATUS_DRAFT,
            'is_sample' => true,
        ], $overrides));
    }

    private function admin(): User
    {
        return User::query()->create([
            'name' => 'Test Admin',
            'email' => 'stories-admin@example.com',
            'password' => Hash::make('correct-password'),
            'is_admin' => true,
        ]);
    }
}
