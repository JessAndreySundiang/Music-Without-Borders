<?php

namespace Tests\Feature;

use App\Models\Story;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoriesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_public_story_list_only_returns_published_stories(): void
    {
        $published = $this->story([
            'title' => 'A Saturday to Remember',
            'slug' => 'a-saturday-to-remember',
            'is_published' => true,
            'published_at' => now(),
        ]);
        $this->story([
            'title' => 'Still a Draft',
            'slug' => 'still-a-draft',
            'is_published' => false,
        ]);

        $this->getJson('/api/stories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $published->id)
            ->assertJsonPath('data.0.slug', 'a-saturday-to-remember');
    }

    public function test_a_published_story_can_be_opened_by_slug_but_a_draft_cannot(): void
    {
        $this->story([
            'title' => 'The Trumpet Came Back',
            'slug' => 'the-trumpet-came-back',
            'is_published' => true,
            'published_at' => now(),
        ]);
        $this->story([
            'title' => 'Draft Story',
            'slug' => 'draft-story',
            'is_published' => false,
        ]);

        $this->getJson('/api/stories/the-trumpet-came-back')
            ->assertOk()
            ->assertJsonPath('data.title', 'The Trumpet Came Back');

        $this->getJson('/api/stories/draft-story')->assertNotFound();
    }

    public function test_an_admin_can_create_update_and_soft_delete_a_story(): void
    {
        Sanctum::actingAs($this->admin());

        $created = $this->postJson('/api/admin/stories', [
            'title' => 'A New Note',
            'excerpt' => 'A short excerpt.',
            'body' => "First paragraph.\n\nSecond paragraph.",
            'author_name' => 'Music Without Borders',
            'is_published' => true,
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'a-new-note')
            ->assertJsonPath('data.is_published', true);

        $id = $created->json('data.id');

        $this->putJson('/api/admin/stories/'.$id, [
            'title' => 'A New Note, Revised',
            'excerpt' => 'A short excerpt.',
            'body' => 'Revised body.',
            'is_published' => false,
            'is_sample' => false,
        ])->assertOk()
            ->assertJsonPath('data.slug', 'a-new-note')
            ->assertJsonPath('data.is_published', false);

        $this->deleteJson('/api/admin/stories/'.$id)->assertOk();
        $this->assertSoftDeleted('stories', ['id' => $id]);
    }

    private function story(array $overrides = []): Story
    {
        return Story::query()->create(array_merge([
            'title' => 'Story',
            'slug' => 'story',
            'excerpt' => 'Excerpt',
            'body' => 'Body',
            'author_name' => 'Music Without Borders',
            'is_published' => false,
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
