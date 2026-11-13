<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PerformanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'performance_date' => $this->performance_date->format('Y-m-d'),
            'event_type' => $this->event_type,
            'venue' => $this->venue,
            'city' => $this->city,
            'duration_minutes' => $this->duration_minutes,
            'conductor' => $this->conductor,
            'description' => $this->description,
        ];
    }
}