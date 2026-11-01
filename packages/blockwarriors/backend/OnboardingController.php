<?php

declare(strict_types=1);

namespace BlockWarriors\Panel;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Pterodactyl\Rules\UserEmail;
use Throwable;

final class OnboardingController
{
    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user() !== null) {
            return redirect('/');
        }

        return response()->view('ext-blockwarriors::join', [
            'enabled' => config('blockwarriors.onboarding.enabled', false),
        ])->header('Cache-Control', 'no-store');
    }

    public function store(Request $request, RequestSetupLink $setup): RedirectResponse
    {
        if ($request->user() !== null) {
            return redirect('/');
        }
        abort_unless(config('blockwarriors.onboarding.enabled', false), 403, 'Account signup is currently closed.');

        if (is_string($request->input('email'))) {
            $request->merge(['email' => Str::lower(trim($request->input('email')))]);
        }
        $data = $request->validate(['email' => ['required', 'string', 'email:strict', 'max:191', new UserEmail]]);

        try {
            $setup->handle($data['email']);
        } catch (Throwable $exception) {
            report($exception);

            return redirect('/join')->withErrors(['email' => 'We could not send the email. Please try again shortly.'])->withInput($request->only('email'));
        }

        // The same redirect and copy for a new account, existing account or cooldown.
        return redirect('/join')->with('setup_requested', true);
    }
}
