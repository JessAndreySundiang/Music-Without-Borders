<?php

namespace App\Http\Controllers;

use App\Http\Resources\PerformanceResource;
use App\Models\Performance;

class PerformanceController extends Controller
{
    public function index()
    {
        $performances = Performance::query()
            ->published()
            ->orderBy('performance_date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        return PerformanceResource::collection($performances);
    }

    public function show(Performance $performance)
    {
        abort_unless($performance->is_published, 404);

        return new PerformanceResource($performance);
    }
}
