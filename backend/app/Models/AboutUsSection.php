<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AboutUsSection extends Model
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
        return $this->hasMany(AboutUsSectionItem::class, 'section_id');
    }
}
