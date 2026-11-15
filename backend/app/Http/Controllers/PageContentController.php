<?php

namespace App\Http\Controllers;

use App\Http\Resources\PageSectionResource;
use App\Http\Resources\PerformanceResource;
use App\Http\Resources\TestimonialResource;
use App\Models\AboutUsSection;
use App\Models\HomeSection;
use App\Models\Performance;
use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;

class PageContentController extends Controller
{
    public function home(): JsonResponse
    {
        $performances = Performance::query()
            ->published()
            ->orderBy('performance_date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        $testimonials = Testimonial::query()
            ->where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $nextPerformance = Performance::query()
            ->published()
            ->whereDate('performance_date', '>=', today())
            ->orderBy('performance_date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->first();

        $sections = HomeSection::query()
            ->where('is_visible', true)
            ->with([
                'items' => fn ($query) => $query
                    ->where('is_visible', true)
                    ->orderBy('sort_order')
                    ->orderBy('id'),
            ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (HomeSection $section) => $this->homeSectionPayload($section, $performances, $testimonials))
            ->values();

        return response()->json([
            'data' => [
                'page' => 'home',
                'sections' => $sections,
                'next_performance' => $nextPerformance
                    ? (new PerformanceResource($nextPerformance))->resolve()
                    : null,
            ],
        ]);
    }

    public function about(): JsonResponse
    {
        $sections = AboutUsSection::query()
            ->where('is_visible', true)
            ->with([
                'items' => fn ($query) => $query
                    ->where('is_visible', true)
                    ->orderBy('sort_order')
                    ->orderBy('id'),
            ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (AboutUsSection $section) => (new PageSectionResource($section))->resolve())
            ->values();

        return response()->json([
            'data' => [
                'page' => 'about',
                'sections' => $sections,
            ],
        ]);
    }

    private function homeSectionPayload(
        HomeSection $section,
        Collection $performances,
        Collection $testimonials,
    ): array {
        $resource = new PageSectionResource($section);

        if ($section->key === 'events') {
            $resource->includeRecords = true;
            $resource->records = PerformanceResource::collection($performances)->resolve();
        }

        if ($section->key === 'testimonials') {
            $resource->includeRecords = true;
            $resource->records = TestimonialResource::collection($testimonials)->resolve();
        }

        return $resource->resolve();
    }
}
