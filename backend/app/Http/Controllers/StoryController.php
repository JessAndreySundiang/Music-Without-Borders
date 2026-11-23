<?php

namespace App\Http\Controllers;

use App\Http\Resources\StoryResource;
use App\Models\Story;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $category = $request->query('category');

        $stories = Story::query()
            ->approved()
            ->when($category && in_array($category, Story::CATEGORIES, true), fn ($query) => $query->where('category', $category))
            ->orderByDesc('published_at')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => StoryResource::collection($stories)->resolve(),
            'meta' => [
                'categories' => Story::CATEGORIES,
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $story = Story::query()->approved()->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => (new StoryResource($story))->resolve(),
        ]);
    }

    public function status(string $referenceCode): JsonResponse
    {
        $code = strtoupper(trim($referenceCode));

        $story = Story::query()
            ->where('reference_code', $code)
            ->firstOrFail();

        return response()->json([
            'data' => [
                'reference_code' => $story->reference_code,
                'title' => $story->title,
                'status' => $story->status,
                'category' => $story->category,
                'submitted_at' => $story->created_at?->toIso8601String(),
                'published_at' => $story->published_at?->toIso8601String(),
                'rejection_reason' => $story->status === Story::STATUS_REJECTED ? $story->rejection_reason : null,
            ],
        ]);
    }
}
