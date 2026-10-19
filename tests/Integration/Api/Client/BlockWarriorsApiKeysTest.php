<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\TransientToken;
use Pterodactyl\Actions\Api\EnsureDefaultAccountApiKey;
use Pterodactyl\Contracts\Users\CreatesUsers;
use Pterodactyl\Models\ApiKey;
use Pterodactyl\Models\User;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

uses(ClientApiIntegrationTestCase::class);

test('default initialization is idempotent and respects later revocation', function (): void {
    $user = User::factory()->create();
    $action = app(EnsureDefaultAccountApiKey::class);
    expect($action->handle($user))->toBeTrue();
    expect($action->handle($user))->toBeFalse();
    expect($user->apiKeys()->count())->toBe(1);
    $user->apiKeys()->delete();
    expect($action->handle($user))->toBeFalse();
    expect($user->apiKeys()->count())->toBe(0);
});

test('existing active keys are retained without minting another', function (): void {
    $user = User::factory()->create();
    $key = $user->createToken('Existing agent', null)->accessToken;
    expect(app(EnsureDefaultAccountApiKey::class)->handle($user))->toBeFalse();
    expect($user->apiKeys()->sole()->identifier)->toBe($key->identifier);
});

test('newly created accounts get a working account key', function (): void {
    Notification::fake();
    $user = app(CreatesUsers::class)->create(['email' => 'member@example.com', 'username' => 'newmember', 'name_first' => 'New', 'name_last' => 'Member', 'password' => 'TestPassword123!']);
    $key = $user->apiKeys()->sole();
    expect($key->key_type)->toBe(ApiKey::TYPE_ACCOUNT);
    expect(ApiKey::findToken($key->identifier.decrypt($key->token))->id)->toBe($key->id);
    expect($user->fresh()->getAttribute('default_api_key_provisioned_at'))->not->toBeNull();
});

test('owner can reveal a complete token through a browser session without cache', function (): void {
    $user = User::factory()->create();
    $key = $user->createToken('My key', null)->accessToken;
    $user->withAccessToken(new TransientToken);
    $response = $this->actingAs($user)->postJson('/api/client/account/api-keys/'.$key->identifier.'/reveal')->assertOk();
    $response->assertJsonPath('token', $key->identifier.decrypt($key->token));
    expect($response->headers->get('Cache-Control'))->toContain('no-store');
    $this->assertActivityFor('user:api-key.reveal', $user, [$user, $key]);
    $this->getJson('/api/client/account/api-keys')->assertOk()->assertJsonMissingPath('data.0.attributes.token');
});

test('browser session cannot reveal another member or application key', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create()->createToken('Other', null)->accessToken;
    $admin = ApiKey::factory()->for($user)->create(['key_type' => ApiKey::TYPE_APPLICATION]);
    $user->withAccessToken(new TransientToken);
    $this->actingAs($user);
    foreach ([$other, $admin] as $key) {
        $this->postJson('/api/client/account/api-keys/'.$key->identifier.'/reveal')->assertNotFound();
    }
});

test('bearer tokens cannot retrieve saved keys', function (): void {
    $user = User::factory()->create();
    $key = $user->createToken('Agent', null)->accessToken;
    $this->withToken($key->identifier.decrypt($key->token))
        ->postJson('/api/client/account/api-keys/'.$key->identifier.'/reveal')->assertForbidden();
});

test('revoked tokens stop authenticating', function (): void {
    $user = User::factory()->create();
    $key = $user->createToken('Revoke me', null)->accessToken;
    $token = $key->identifier.decrypt($key->token);
    $user->withAccessToken(new TransientToken);
    $this->actingAs($user)->deleteJson('/api/client/account/api-keys/'.$key->identifier)->assertNoContent();
    expect(ApiKey::findToken($token))->toBeNull();
});
