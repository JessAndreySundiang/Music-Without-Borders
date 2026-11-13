<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Performance extends Model
{
    protected $fillable = [
        'title',
        'performance_date',
        'event_type',
        'venue',
        'city',
        'duration_minutes',
        'conductor',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'performance_date' => 'date',
        ];
    }
}