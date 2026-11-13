<?php

namespace App\Http\Controllers;

use App\Http\Resources\PerformanceResource;
use App\Models\Performance;

class PerformanceController extends Controller
{
    public function index()
    {
        $performances = Performance::orderBy('performance_date')->get();

        return PerformanceResource::collection($performances);
    }

    public function show(Performance $performance)
    {
        return new PerformanceResource($performance);
    }
}