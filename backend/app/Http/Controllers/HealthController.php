<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Readiness check for the API host. It intentionally checks the database
     * connection so a load balancer does not send traffic to an API that cannot
     * serve the CMS.
     */
    public function __invoke(): JsonResponse
    {
        DB::connection()->getPdo();

        return response()
            ->json([
                'status' => 'ok',
                'service' => 'api',
                'time' => now()->toIso8601String(),
            ])
            ->header('Cache-Control', 'no-store');
    }
}
