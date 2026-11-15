<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HomeSection extends Model
{
    protected $fillable = [
        'key',
        'component',
        'eyebrow',
        'title',
        'body',
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

    public function items(): HasMany
    {
        return $this->hasMany(HomeSectionItem::class, 'section_id');
    }
}
