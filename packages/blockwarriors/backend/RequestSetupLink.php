<?php

declare(strict_types=1);

namespace BlockWarriors\Panel;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Pterodactyl\Contracts\Users\CreatesUsers;
use Pterodactyl\Models\User;
use RuntimeException;

final readonly class RequestSetupLink
{
    public function __construct(private CreatesUsers $users) {}

    public function handle(string $email): void
    {
        // No email addresses in cache keys. A shared lock prevents duplicate requests
        // from racing account creation or sending multiple setup messages.
        $key = 'bw-onboarding:'.hash('sha256', $email);
        Cache::lock($key.':lock', 30)->get(function () use ($email, $key): void {
            if (RateLimiter::tooManyAttempts($key, 3) || Cache::has($key.':cooldown')) {
                return;
            }

            RateLimiter::hit($key, 3600);
            $user = User::query()->where('email', $email)->first();
            if ($user === null) {
                try {
                    // Only these server-owned attributes can reach the existing action.
                    // No password means its normal queued account-setup email is sent.
                    $this->users->create([
                        'email' => $email,
                        'username' => 'member_'.Str::lower(Str::random(12)),
                        'name_first' => 'BlockWarriors',
                        'name_last' => 'Member',
                        'root_admin' => false,
                    ]);
                    Cache::put($key.':cooldown', true, 60);

                    return;
                } catch (QueryException $exception) {
                    // An administrator or another entry point may have created it
                    // concurrently. Never retry a failed account mutation blindly.
                    $user = User::query()->where('email', $email)->first();
                    if ($user === null) {
                        throw $exception;
                    }
                }
            }

            // Existing accounts keep their identity, password, permissions and 2FA.
            // The standard password broker owns token expiry and one-time use.
            $status = Password::broker()->sendResetLink(['email' => $user->email]);
            if (! in_array($status, [Password::RESET_LINK_SENT, Password::RESET_THROTTLED], true)) {
                throw new RuntimeException('The account setup message could not be queued.');
            }
            Cache::put($key.':cooldown', true, 60);
        });
    }
}
