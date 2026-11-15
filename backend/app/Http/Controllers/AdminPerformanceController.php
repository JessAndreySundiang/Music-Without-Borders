<?php

namespace App\Http\Controllers;

use App\Http\Resources\PerformanceResource;
use App\Models\Performance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPerformanceController extends Controller
{
    public function index(): JsonResponse
    {
        $performances = Performance::query()
            ->orderBy('performance_date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => PerformanceResource::collection($performances)->resolve(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['is_published'] ??= true;
        $performance = Performance::query()->create($data);

        return response()->json([
            'data' => (new PerformanceResource($performance))->resolve(),
        ], 201);
    }

    public function update(Request $request, Performance $performance): JsonResponse
    {
        $performance->fill($this->validated($request))->save();

        return response()->json([
            'data' => (new PerformanceResource($performance))->resolve(),
        ]);
    }

    public function destroy(Performance $performance): JsonResponse
    {
        $performance->delete();

        return response()->json(['message' => 'Performance moved to the recycle bin.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'performance_date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'event_type' => ['required', 'string', 'max:100'],
            'venue' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'conductor' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'is_published' => ['sometimes', 'boolean'],
        ]);
    }
}
