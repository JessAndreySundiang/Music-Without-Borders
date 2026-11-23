<?php

namespace App\Http\Controllers;

use App\Http\Resources\AdminStoryResource;
use App\Mail\StoryApprovedNotification;
use App\Mail\StoryRejectedNotification;
use App\Models\Story;
use App\Models\StoryModerationEvent;
use App\Support\StorySlug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminStoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(Story::STATUSES)],
            'category' => ['sometimes', 'string', Rule::in(Story::CATEGORIES)],
        ]);

        $counts = array_fill_keys(Story::STATUSES, 0);

        Story::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->each(function (int|string $total, string $status) use (&$counts): void {
                if (array_key_exists($status, $counts)) {
                    $counts[$status] = (int) $total;
                }
            });

        $counts['all'] = array_sum($counts);

        $stories = Story::query()
            ->with(['reviewer', 'moderationEvents.actor'])
            ->when(
                $filters['status'] ?? null,
                fn ($query, string $status) => $query->where('status', $status),
            )
            ->when(
                $filters['category'] ?? null,
                fn ($query, string $category) => $query->where('category', $category),
            )
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => AdminStoryResource::collection($stories)->resolve(),
            'meta' => ['counts' => $counts],
        ]);
    }

    public function store(Request $request, StorySlug $slugs): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $slugs->unique(
            filled($data['slug'] ?? null) ? $data['slug'] : $data['title'],
        );
        $data['status'] = Story::STATUS_DRAFT;
        $data['published_at'] = null;
        $data['is_sample'] ??= false;

        $story = Story::query()->create($data);

        return response()->json([
            'data' => (new AdminStoryResource($story->load(['reviewer', 'moderationEvents.actor'])))->resolve(),
        ], 201);
    }

    public function update(Request $request, Story $story, StorySlug $slugs): JsonResponse
    {
        $data = $this->validated($request, $story);

        if (array_key_exists('slug', $data) || array_key_exists('title', $data)) {
            $base = filled($data['slug'] ?? null)
                ? $data['slug']
                : ($story->slug ?: ($data['title'] ?? $story->title));

            $data['slug'] = $slugs->unique($base, $story->id);
        }

        // Status, reviewer fields, and published_at are intentionally absent
        // from the validated payload. Moderation goes through the actions below.
        $story->fill($data)->save();

        return response()->json([
            'data' => (new AdminStoryResource($story->load(['reviewer', 'moderationEvents.actor'])))->resolve(),
        ]);
    }

    public function destroy(Story $story): JsonResponse
    {
        $story->delete();

        return response()->json(['message' => 'Story moved to the recycle bin.']);
    }

    public function approve(Request $request, Story $story): JsonResponse
    {
        if (! in_array($story->status, [Story::STATUS_DRAFT, Story::STATUS_PENDING], true)) {
            throw ValidationException::withMessages([
                'status' => 'Only a draft or pending story can be approved.',
            ]);
        }

        DB::transaction(function () use ($request, $story): void {
            $story->forceFill([
                'status' => Story::STATUS_APPROVED,
                'published_at' => now(),
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ])->save();

            $story->moderationEvents()->create([
                'action' => StoryModerationEvent::ACTION_APPROVED,
                'actor_id' => $request->user()->id,
                'reason' => null,
                'created_at' => now(),
            ]);
        });

        Log::info("Story #{$story->id} approved by user #{$request->user()->id}");

        DB::afterCommit(function () use ($story): void {
            if ($story->author_email) {
                try {
                    $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
                    $publicUrl = $frontendUrl.'/stories/'.$story->slug;
                    Mail::to($story->author_email)->send(new StoryApprovedNotification($story, $publicUrl));
                } catch (\Throwable $e) {
                    Log::warning('Failed to send story approval notification: '.$e->getMessage());
                }
            }
        });

        return response()->json([
            'data' => (new AdminStoryResource($story->load(['reviewer', 'moderationEvents.actor'])))->resolve(),
        ]);
    }

    public function reject(Request $request, Story $story): JsonResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        if ($story->status !== Story::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'status' => 'Only a pending submission can be rejected.',
            ]);
        }

        $reason = trim($data['rejection_reason']);

        DB::transaction(function () use ($request, $story, $reason): void {
            $story->forceFill([
                'status' => Story::STATUS_REJECTED,
                'rejection_reason' => $reason,
                'published_at' => null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ])->save();

            $story->moderationEvents()->create([
                'action' => StoryModerationEvent::ACTION_REJECTED,
                'actor_id' => $request->user()->id,
                'reason' => $reason,
                'created_at' => now(),
            ]);
        });

        Log::info("Story #{$story->id} rejected by user #{$request->user()->id}");

        DB::afterCommit(function () use ($story, $reason): void {
            if ($story->author_email) {
                try {
                    Mail::to($story->author_email)->send(new StoryRejectedNotification($story, $reason));
                } catch (\Throwable $e) {
                    Log::warning('Failed to send story rejection notification: '.$e->getMessage());
                }
            }
        });

        return response()->json([
            'data' => (new AdminStoryResource($story->load(['reviewer', 'moderationEvents.actor'])))->resolve(),
        ]);
    }

    public function reopen(Story $story): JsonResponse
    {
        if ($story->status !== Story::STATUS_REJECTED) {
            throw ValidationException::withMessages([
                'status' => 'Only a rejected story can be reopened.',
            ]);
        }

        DB::transaction(function () use ($story): void {
            $story->forceFill([
                'status' => Story::STATUS_PENDING,
                'published_at' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ])->save();

            $story->moderationEvents()->create([
                'action' => StoryModerationEvent::ACTION_REOPENED,
                'actor_id' => request()->user()?->id,
                'reason' => null,
                'created_at' => now(),
            ]);
        });

        Log::info("Story #{$story->id} reopened by user #".(request()->user()?->id ?? 'unknown'));

        return response()->json([
            'data' => (new AdminStoryResource($story->load(['reviewer', 'moderationEvents.actor'])))->resolve(),
        ]);
    }

    public function feature(Story $story): JsonResponse
    {
        if ($story->status !== Story::STATUS_APPROVED) {
            throw ValidationException::withMessages([
                'status' => 'Only an approved story can be featured.',
            ]);
        }

        DB::transaction(function () use ($story): void {
            Story::query()
                ->where('is_featured', true)
                ->where('id', '!=', $story->id)
                ->update(['is_featured' => false]);

            $story->forceFill(['is_featured' => true])->save();
        });

        Log::info("Story #{$story->id} set as featured by user #".(request()->user()?->id ?? 'unknown'));

        return response()->json([
            'data' => (new AdminStoryResource($story->load(['reviewer', 'moderationEvents.actor'])))->resolve(),
        ]);
    }

    public function unfeature(Story $story): JsonResponse
    {
        $story->forceFill(['is_featured' => false])->save();

        Log::info("Story #{$story->id} unfeatured by user #".(request()->user()?->id ?? 'unknown'));

        return response()->json([
            'data' => (new AdminStoryResource($story->load(['reviewer', 'moderationEvents.actor'])))->resolve(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Story $story = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['sometimes', 'string', Rule::in(Story::CATEGORIES)],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('stories', 'slug')->ignore($story?->id),
            ],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'author_name' => ['nullable', 'string', 'max:255'],
            'author_role' => ['nullable', 'string', 'max:255'],
            'cover_image_path' => ['nullable', 'string', 'max:2048'],
            'cover_image_url' => ['nullable', 'string', 'url', 'regex:/^https:\/\//i', 'max:2048'],
            'is_sample' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);
    }
}
