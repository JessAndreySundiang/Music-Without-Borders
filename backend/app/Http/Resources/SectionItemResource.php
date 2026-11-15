<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SectionItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'item_type' => $this->item_type,
            'title' => $this->title,
            'body' => $this->body,
            'value' => $this->value,
            'icon' => $this->icon,
            'link_label' => $this->link_label,
            'link_url' => $this->link_url,
            'image_path' => $this->image_path,
            'image_url' => $this->image_path ? asset('storage/'.$this->image_path) : null,
            'extra' => (object) ($this->extra ?? []),
            'sort_order' => $this->sort_order,
            'is_visible' => $this->is_visible,
        ];
    }
}
