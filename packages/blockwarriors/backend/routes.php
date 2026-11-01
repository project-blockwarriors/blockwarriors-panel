<?php

declare(strict_types=1);

use BlockWarriors\Panel\OnboardingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [OnboardingController::class, 'show'])->name('show');
Route::post('/', [OnboardingController::class, 'store'])
    ->middleware(['throttle:blockwarriors.onboarding', 'recaptcha'])
    ->name('store');
