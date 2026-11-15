<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeSectionItem extends Model
{
    protected $fillable = [
        'section_id',
        'item_type',
        'title',
        'body',
        'value',
        'icon',
        'link_label',
        'link_url',
        'image_path',
        'extra',
        'sort_order',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'extra' => 'array',
            'is_visible' => 'boolean',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(HomeSection::class, 'section_id');
    }
}
