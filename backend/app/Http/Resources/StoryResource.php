<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public representation. Private submission and moderation fields are omitted.
 */
class StoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->category,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'author_name' => $this->author_name,
            'author_role' => $this->author_role,
            'cover_image_path' => $this->cover_image_path,
            'cover_image_url' => $this->cover_image_url ?: ($this->cover_image_path ? asset('storage/'.$this->cover_image_path) : null),
            'is_sample' => $this->is_sample,
            'is_featured' => (bool) $this->is_featured,
            'published_at' => $this->published_at?->format('Y-m-d'),
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
