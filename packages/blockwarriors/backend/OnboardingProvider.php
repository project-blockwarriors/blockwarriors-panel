<?php

declare(strict_types=1);

namespace BlockWarriors\Panel;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Pterodactyl\Extensions\ExtensionProvider;

final class OnboardingProvider extends ExtensionProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/config.php', 'blockwarriors.onboarding');
    }

    public function boot(): void
    {
        $this->loadExtensionViews();
        RateLimiter::for('blockwarriors.onboarding', static fn (Request $request): array => [
            Limit::perMinute(20)->by('minute:'.$request->ip()),
            Limit::perHour(120)->by('hour:'.$request->ip()),
        ]);
        $this->registerRootRoutes(__DIR__.'/routes.php', 'join');
    }
}
