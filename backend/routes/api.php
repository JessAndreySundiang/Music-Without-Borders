<?php

use App\Http\Controllers\PerformanceController;
use Illuminate\Support\Facades\Route;

Route::get('/performances', [PerformanceController::class, 'index']);
Route::get('/performances/{performance}', [PerformanceController::class, 'show']);