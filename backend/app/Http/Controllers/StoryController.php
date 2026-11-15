<?php

namespace App\Http\Controllers;

use App\Http\Resources\StoryResource;
use App\Models\Story;
use Illuminate\Http\JsonResponse;

class StoryController extends Controller
{
    public function index(): JsonResponse
    {
        $stories = Story::query()
            ->published()
            ->orderByDesc('published_at')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => StoryResource::collection($stories)->resolve(),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $story = Story::query()->published()->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => (new StoryResource($story))->resolve(),
        ]);
    }
}
