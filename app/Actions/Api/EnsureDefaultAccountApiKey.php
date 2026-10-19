<?php

declare(strict_types=1);

namespace Pterodactyl\Actions\Api;

use Illuminate\Support\Facades\DB;
use Pterodactyl\Contracts\Api\CreatesAccountApiKeys;
use Pterodactyl\Models\User;

final readonly class EnsureDefaultAccountApiKey
{
    public function __construct(private CreatesAccountApiKeys $keys) {}

    /** Initialize once, without replacing existing keys or undoing an intentional revocation. */
    public function handle(User $user): bool
    {
        return DB::transaction(function () use ($user): bool {
            $locked = User::query()->lockForUpdate()->findOrFail($user->id);
            if ($locked->getAttribute('default_api_key_provisioned_at') !== null) {
                return false;
            }

            $hasActiveKey = $locked->apiKeys()->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))->exists();
            if (! $hasActiveKey) {
                $this->keys->create($locked, 'My BlockWarriors key', null);
            }

            $locked->forceFill(['default_api_key_provisioned_at' => now()])->save();

            return ! $hasActiveKey;
        });
    }
}
