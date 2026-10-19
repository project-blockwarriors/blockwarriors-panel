<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class RevealApiKeyController extends ClientApiController
{
    public function __invoke(ClientApiRequest $request, string $identifier): JsonResponse
    {
        // apiKeys scopes to this user's account keys, never application keys.
        $key = $request->user()->apiKeys()->where('identifier', $identifier)->firstOrFail();
        Activity::event('user:api-key.reveal')->subject($request->user(), $key)->property('identifier', $key->identifier)->log();

        return response()->json(['token' => $key->identifier.decrypt($key->token)], 200, [
            'Cache-Control' => 'no-store, private',
            'Pragma' => 'no-cache',
        ]);
    }
}
