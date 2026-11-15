<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Performance extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'performance_date',
        'start_time',
        'event_type',
        'venue',
        'city',
        'duration_minutes',
        'conductor',
        'description',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'performance_date' => 'date',
            'is_published' => 'boolean',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}
