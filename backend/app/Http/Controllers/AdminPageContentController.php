<?php

namespace App\Http\Controllers;

use App\Http\Resources\PageSectionResource;
use App\Http\Resources\SectionItemResource;
use App\Models\AboutUsSection;
use App\Models\AboutUsSectionItem;
use App\Models\HomeSection;
use App\Models\HomeSectionItem;
use App\Models\SiteSetting;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPageContentController extends Controller
{
    public function home(): JsonResponse
    {
        $sections = HomeSection::query()
            ->with(['items' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => [
                'page' => 'home',
                'sections' => PageSectionResource::collection($sections)->resolve(),
            ],
        ]);
    }

    public function about(): JsonResponse
    {
        $sections = AboutUsSection::query()
            ->with(['items' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => [
                'page' => 'about',
                'sections' => PageSectionResource::collection($sections)->resolve(),
            ],
        ]);
    }

    public function updateHomeSection(Request $request, HomeSection $section): JsonResponse
    {
        $this->applySectionUpdate($request, $section);

        return $this->sectionResponse($section);
    }

    public function updateAboutSection(Request $request, AboutUsSection $section): JsonResponse
    {
        $this->applySectionUpdate($request, $section);

        return $this->sectionResponse($section);
    }

    public function updateHomeItem(Request $request, HomeSectionItem $item): JsonResponse
    {
        $this->applyItemUpdate($request, $item);

        return response()->json(['data' => (new SectionItemResource($item))->resolve()]);
    }

    public function updateAboutItem(Request $request, AboutUsSectionItem $item): JsonResponse
    {
        $this->applyItemUpdate($request, $item);

        return response()->json(['data' => (new SectionItemResource($item))->resolve()]);
    }

    public function reorderHomeSections(Request $request): JsonResponse
    {
        $this->applyOrder($request, HomeSection::class);

        return $this->home();
    }

    public function reorderAboutSections(Request $request): JsonResponse
    {
        $this->applyOrder($request, AboutUsSection::class);

        return $this->about();
    }

    public function reorderHomeItems(Request $request): JsonResponse
    {
        $this->applyOrder($request, HomeSectionItem::class);

        return response()->json(['message' => 'Items reordered.']);
    }

    public function reorderAboutItems(Request $request): JsonResponse
    {
        $this->applyOrder($request, AboutUsSectionItem::class);

        return response()->json(['message' => 'Items reordered.']);
    }

    public function settings(): JsonResponse
    {
        $settings = SiteSetting::query()
            ->orderBy('key')
            ->get()
            ->mapWithKeys(fn (SiteSetting $setting) => [$setting->key => $setting->value])
            ->all();

        return response()->json(['data' => (object) $settings]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $key => $value) {
            if (! is_string($key) || $key === '') {
                continue;
            }

            SiteSetting::query()->updateOrCreate(
                ['key' => $key],
                [
                    'group_name' => explode('.', $key)[0],
                    'value' => $value,
                ],
            );
        }

        return $this->settings();
    }

    private function applySectionUpdate(Request $request, HomeSection|AboutUsSection $section): void
    {
        $data = $request->validate([
            'eyebrow' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body' => ['sometimes', 'nullable', 'string'],
            'extra' => ['sometimes', 'nullable', 'array'],
            'is_visible' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $section->fill($data)->save();
    }

    private function applyItemUpdate(Request $request, HomeSectionItem|AboutUsSectionItem $item): void
    {
        $data = $request->validate([
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body' => ['sometimes', 'nullable', 'string'],
            'value' => ['sometimes', 'nullable', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:64'],
            'link_label' => ['sometimes', 'nullable', 'string', 'max:255'],
            'link_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'image_path' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'extra' => ['sometimes', 'nullable', 'array'],
            'is_visible' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $item->fill($data)->save();
    }

    /**
     * @param  class-string<Model>  $model
     */
    private function applyOrder(Request $request, string $model): void
    {
        $table = match ($model) {
            HomeSection::class => 'home_sections',
            HomeSectionItem::class => 'home_section_items',
            AboutUsSection::class => 'about_us_sections',
            AboutUsSectionItem::class => 'about_us_section_items',
        };

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', Rule::exists($table, 'id')],
        ]);

        foreach ($data['ids'] as $position => $id) {
            $model::query()->whereKey($id)->update(['sort_order' => $position + 1]);
        }
    }

    private function sectionResponse(HomeSection|AboutUsSection $section): JsonResponse
    {
        $section->load(['items' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')]);

        return response()->json([
            'data' => (new PageSectionResource($section))->resolve(),
        ]);
    }
}
