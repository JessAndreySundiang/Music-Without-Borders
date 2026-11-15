<?php

namespace App\Http\Controllers;

use App\Http\Resources\StoryResource;
use App\Models\Story;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminStoryController extends Controller
{
    public function index(): JsonResponse
    {
        $stories = Story::query()
            ->orderByDesc('published_at')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => StoryResource::collection($stories)->resolve(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug(
            $data['slug'] ?? Str::slug($data['title']),
        );
        $data['is_published'] ??= false;
        $data['is_sample'] ??= false;
        $data['published_at'] = $data['is_published'] ? now() : null;

        $story = Story::query()->create($data);

        return response()->json([
            'data' => (new StoryResource($story))->resolve(),
        ], 201);
    }

    public function update(Request $request, Story $story): JsonResponse
    {
        $data = $this->validated($request, $story);

        if (array_key_exists('slug', $data) || array_key_exists('title', $data)) {
            $data['slug'] = $this->uniqueSlug(
                $data['slug'] ?? ($story->slug ?: Str::slug($data['title'] ?? $story->title)),
                $story->id,
            );
        }

        if (array_key_exists('is_published', $data)) {
            $data['published_at'] = $data['is_published']
                ? ($story->published_at ?? now())
                : null;
        }

        $story->fill($data)->save();

        return response()->json([
            'data' => (new StoryResource($story))->resolve(),
        ]);
    }

    public function destroy(Story $story): JsonResponse
    {
        $story->delete();

        return response()->json(['message' => 'Story moved to the recycle bin.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Story $story = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
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
            'is_published' => ['sometimes', 'boolean'],
            'is_sample' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'story';
        $candidate = $slug;
        $suffix = 2;

        while (
            Story::withTrashed()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->exists()
        ) {
            $candidate = $slug.'-'.$suffix;
            $suffix++;
        }

        return $candidate;
    }
}
