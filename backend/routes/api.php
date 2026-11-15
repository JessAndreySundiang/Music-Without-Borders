<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminPageContentController;
use App\Http\Controllers\AdminPerformanceController;
use App\Http\Controllers\AdminStoryController;
use App\Http\Controllers\AdminTestimonialController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\PageContentController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\SiteSettingController;
use App\Http\Controllers\StoryController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);
Route::get('/home', [PageContentController::class, 'home']);
Route::get('/about', [PageContentController::class, 'about']);
Route::get('/settings', [SiteSettingController::class, 'index']);

Route::get('/performances', [PerformanceController::class, 'index']);
Route::get('/performances/{performance}', [PerformanceController::class, 'show']);

Route::get('/stories', [StoryController::class, 'index']);
Route::get('/stories/{slug}', [StoryController::class, 'show']);

Route::prefix('admin')->group(function (): void {
    Route::post('/login', [AdminAuthController::class, 'login'])->middleware('throttle:6,1');
    Route::post('/forgot-password', [AdminAuthController::class, 'forgotPassword'])
        ->middleware('throttle:4,1');
    Route::post('/reset-password', [AdminAuthController::class, 'resetPassword'])
        ->middleware('throttle:6,1');

    Route::middleware(['auth:sanctum', 'admin'])->group(function (): void {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);

        Route::get('/home', [AdminPageContentController::class, 'home']);
        Route::get('/about', [AdminPageContentController::class, 'about']);
        Route::patch('/home/sections/{section}', [AdminPageContentController::class, 'updateHomeSection']);
        Route::patch('/about/sections/{section}', [AdminPageContentController::class, 'updateAboutSection']);
        Route::patch('/home/items/{item}', [AdminPageContentController::class, 'updateHomeItem']);
        Route::patch('/about/items/{item}', [AdminPageContentController::class, 'updateAboutItem']);
        Route::put('/home/sections/reorder', [AdminPageContentController::class, 'reorderHomeSections']);
        Route::put('/about/sections/reorder', [AdminPageContentController::class, 'reorderAboutSections']);
        Route::put('/home/items/reorder', [AdminPageContentController::class, 'reorderHomeItems']);
        Route::put('/about/items/reorder', [AdminPageContentController::class, 'reorderAboutItems']);

        Route::get('/settings', [AdminPageContentController::class, 'settings']);
        Route::patch('/settings', [AdminPageContentController::class, 'updateSettings']);

        Route::apiResource('/performances', AdminPerformanceController::class)->except(['show']);
        Route::apiResource('/testimonials', AdminTestimonialController::class)->except(['show']);
        Route::apiResource('/stories', AdminStoryController::class)->except(['show']);
    });
});
