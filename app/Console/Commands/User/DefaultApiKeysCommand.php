<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\User;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Actions\Api\EnsureDefaultAccountApiKey;
use Pterodactyl\Models\User;

#[Description('Initialize a member API key once for each existing account. Never prints credentials.')]
#[Signature('bw:api-keys:initialize')]
class DefaultApiKeysCommand extends Command
{
    public function handle(EnsureDefaultAccountApiKey $keys): int
    {
        $created = 0;
        User::query()->whereNull('default_api_key_provisioned_at')->chunkById(100, function ($users) use ($keys, &$created): void {
            foreach ($users as $user) {
                $created += (int) $keys->handle($user);
            }
        });
        $this->info("Initialized accounts; created {$created} member keys. Existing keys preserved.");

        return self::SUCCESS;
    }
}
