<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin representation. This is the only story output that may contain the
 * author's email address and moderation metadata.
 */
class AdminStoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference_code' => $this->reference_code,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->category,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'author_name' => $this->author_name,
            'author_email' => $this->author_email,
            'author_role' => $this->author_role,
            'cover_image_path' => $this->cover_image_path,
            'cover_image_url' => $this->cover_image_url ?: ($this->cover_image_path ? asset('storage/'.$this->cover_image_path) : null),
            'status' => $this->status,
            'consent_at' => $this->consent_at?->toIso8601String(),
            'reviewed_by' => $this->reviewed_by,
            'reviewer_name' => $this->whenLoaded('reviewer', fn () => $this->reviewer?->name),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'is_sample' => $this->is_sample,
            'is_featured' => (bool) $this->is_featured,
            'published_at' => $this->published_at?->format('Y-m-d'),
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'events' => $this->whenLoaded('moderationEvents', fn () => $this->moderationEvents->map(fn ($event) => [
                'id' => $event->id,
                'action' => $event->action,
                'actor_id' => $event->actor_id,
                'actor_name' => $event->actor?->name,
                'reason' => $event->reason,
                'created_at' => $event->created_at?->toIso8601String(),
            ])->values()),
        ];
    }
}
