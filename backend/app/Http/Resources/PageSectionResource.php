<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PageSectionResource extends JsonResource
{
    /**
     * Events and testimonials are hydrated by the controller from their own
     * tables rather than duplicated inside section_items.
     */
    public bool $includeRecords = false;

    /** @var array<int, array<string, mixed>> */
    public array $records = [];

    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'key' => $this->key,
            'component' => $this->component,
            'eyebrow' => $this->eyebrow,
            'title' => $this->title,
            'body' => $this->body,
            'extra' => (object) ($this->extra ?? []),
            'sort_order' => $this->sort_order,
            'is_visible' => $this->is_visible,
            'items' => SectionItemResource::collection($this->whenLoaded('items')),
        ];

        if ($this->includeRecords) {
            $data['records'] = $this->records;
        }

        return $data;
    }
}
