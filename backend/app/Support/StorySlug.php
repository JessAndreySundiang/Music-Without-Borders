<?php

namespace App\Support;

use App\Models\Story;
use Illuminate\Support\Str;

class StorySlug
{
    /**
     * Build a unique slug without reusing a soft-deleted story's address.
     */
    public function unique(string $title, ?int $ignoreId = null): string
    {
        $slug = Str::slug($title) ?: 'story';
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
