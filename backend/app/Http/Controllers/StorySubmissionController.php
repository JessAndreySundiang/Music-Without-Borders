<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStorySubmissionRequest;
use App\Mail\StorySubmissionAlert;
use App\Mail\StorySubmittedConfirmation;
use App\Models\Story;
use App\Models\StoryModerationEvent;
use App\Support\StorySlug;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class StorySubmissionController extends Controller
{
    public function store(StoreStorySubmissionRequest $request, StorySlug $slugs): JsonResponse
    {
        $data = $request->validated();
        $body = trim($data['body']);

        $story = DB::transaction(function () use ($data, $body, $slugs) {
            $story = Story::query()->create([
                'title' => trim($data['title']),
                'slug' => $slugs->unique($data['title']),
                'category' => $data['category'] ?? Story::CATEGORY_COMMUNITY,
                'excerpt' => filled($data['excerpt'] ?? null)
                    ? trim($data['excerpt'])
                    : Str::limit(trim((string) preg_replace('/\s+/', ' ', $body)), 180),
                'body' => $body,
                'author_name' => trim($data['author_name']),
                'author_role' => filled($data['author_role'] ?? null) ? trim($data['author_role']) : null,
                'author_email' => Str::lower(trim($data['author_email'])),
                'cover_image_url' => filled($data['cover_image_url'] ?? null) ? trim($data['cover_image_url']) : null,
                'status' => Story::STATUS_PENDING,
                'consent_at' => now(),
                'published_at' => null,
                'is_sample' => false,
            ]);

            $story->moderationEvents()->create([
                'action' => StoryModerationEvent::ACTION_SUBMITTED,
                'actor_id' => null,
                'reason' => null,
                'created_at' => now(),
            ]);

            return $story;
        });

        DB::afterCommit(function () use ($story) {
            $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
            $reviewUrl = $frontendUrl.'/admin?tab=stories';

            // Author confirmation
            try {
                Mail::to($story->author_email)->send(new StorySubmittedConfirmation($story));
            } catch (\Throwable $e) {
                Log::warning('Failed to send story submission confirmation: '.$e->getMessage());
            }

            // Admin alert
            $adminEmail = config('mail.story_admin_email', 'Communitymusicband@gmail.com');
            if ($adminEmail) {
                try {
                    Mail::to($adminEmail)->send(new StorySubmissionAlert($story, $reviewUrl));
                } catch (\Throwable $e) {
                    Log::warning('Failed to send story submission admin alert: '.$e->getMessage());
                }
            }
        });

        return response()->json([
            'message' => 'Thank you. Your story was received and is waiting for review.',
            'reference_code' => $story->reference_code,
        ], 201);
    }
}
