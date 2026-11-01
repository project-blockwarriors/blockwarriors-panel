<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Http\BlockWarriorsOnboardingTest;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Notification;
use Pterodactyl\Models\Extension;
use Pterodactyl\Models\User;
use Pterodactyl\Notifications\AccountCreated;
use Pterodactyl\Notifications\SendPasswordReset;
use Pterodactyl\Services\Extensions\ExtensionProviderLoader;
use Pterodactyl\Services\Extensions\ExtensionRepository;
use Pterodactyl\Tests\Integration\Http\HttpTestCase;
use RuntimeException;

uses(HttpTestCase::class);

beforeEach(function (): void {
    Notification::fake();
    Cache::flush();
    $this->extensionDirectory = sys_get_temp_dir().'/bw-onboarding-'.getmypid();
    $package = $this->extensionDirectory.'/blockwarriors';
    File::ensureDirectoryExists($package.'/dist');
    File::copy(base_path('packages/blockwarriors/extension.json'), $package.'/extension.json');
    File::copyDirectory(base_path('packages/blockwarriors/backend'), $package.'/backend');
    File::copyDirectory(base_path('packages/blockwarriors/resources'), $package.'/resources');
    File::put($package.'/dist/client.js', 'export default {};');
    File::put($package.'/dist/theme.css', ':root{}');
    config([
        'extensions.enabled' => true,
        'extensions.panel_version' => '2.0.0-beta.2',
        'extensions.directory' => $this->extensionDirectory,
        'extensions.assets_directory' => $this->extensionDirectory.'/assets',
        'blockwarriors.onboarding.enabled' => true,
    ]);
    Extension::query()->create(['identifier' => 'blockwarriors', 'version' => '1.5.0', 'enabled' => true]);
    app(ExtensionRepository::class)->flushDiscovery();
    app(ExtensionProviderLoader::class)->registerProviders(app(ExtensionRepository::class)->enabled());
    expect(app(ExtensionRepository::class)->isAvailable('blockwarriors'))->toBeTrue();
});

afterEach(function (): void {
    File::deleteDirectory($this->extensionDirectory);
});

test('join page asks only for email and does not create an account', function (): void {
    $count = User::query()->count();
    $this->get('/join')->assertOk()->assertSee('Send setup link')->assertSee('name="email"', false)->assertDontSee('name="password"', false);
    expect(User::query()->count())->toBe($count);
    Notification::assertNothingSent();
});

test('new signup is normalized and grants no server or administrative access', function (): void {
    $this->post('/join', ['email' => ' New.Member@Example.com ', 'root_admin' => true, 'password' => 'attacker-password', 'username' => 'admin'])
        ->assertRedirect('/join')->assertSessionHas('setup_requested', true);
    $user = User::query()->where('email', 'new.member@example.com')->sole();
    expect($user->root_admin)->toBeFalse()
        ->and($user->username)->not->toBe('admin')
        ->and($user->servers()->count())->toBe(0)
        ->and($user->apiKeys()->count())->toBe(1);
    $this->assertGuest();
    Notification::assertSentTo($user, AccountCreated::class, fn (AccountCreated $message): bool => filled($message->token));
});

test('existing account retains password two factor and permissions', function (): void {
    $user = User::factory()->create(['email' => 'existing@example.com', 'root_admin' => true, 'use_totp' => true, 'totp_secret' => encrypt(str_repeat('a', 16))]);
    $attributes = $user->refresh()->getAttributes();
    $count = User::query()->count();
    $this->post('/join', ['email' => 'EXISTING@example.com'])->assertRedirect('/join')->assertSessionHas('setup_requested', true);
    expect(User::query()->count())->toBe($count)->and($user->refresh()->getAttributes())->toBe($attributes);
    Notification::assertSentTo($user, SendPasswordReset::class);
    Notification::assertNotSentTo($user, AccountCreated::class);
    $this->assertGuest();
});

test('repeated requests do not duplicate accounts or setup emails', function (): void {
    foreach (range(1, 3) as $index) {
        $this->post('/join', ['email' => 'repeat@example.com'])->assertRedirect('/join')->assertSessionHas('setup_requested', true);
    }
    expect(User::query()->where('email', 'repeat@example.com')->count())->toBe(1);
    Notification::assertCount(1);
});

test('an hourly email limit also applies across source addresses', function (): void {
    $user = User::factory()->create(['email' => 'limited@example.com']);
    foreach (range(1, 4) as $index) {
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.'.$index])->post('/join', ['email' => $user->email])->assertRedirect('/join');
        $this->travel(61)->seconds();
    }
    Notification::assertSentToTimes($user, SendPasswordReset::class, 3);
});

test('closed signup cannot create accounts or send mail', function (): void {
    config(['blockwarriors.onboarding.enabled' => false]);
    $this->get('/join')->assertOk()->assertSee('Account signup is closed');
    $this->post('/join', ['email' => 'closed@example.com'])->assertForbidden();
    expect(User::query()->where('email', 'closed@example.com')->exists())->toBeFalse();
    Notification::assertNothingSent();
});

test('invalid addresses are rejected before any mutation', function (mixed $email): void {
    $this->postJson('/join', ['email' => $email])->assertUnprocessable()->assertJsonPath('errors.0.meta.source_field', 'email');
    Notification::assertNothingSent();
})->with(['malformed' => ['not-an-email'], 'array' => [['x@example.com']], 'option' => ['-option@example.com'], 'empty' => ['']]);

test('the existing captcha protects the public signup endpoint', function (): void {
    config(['recaptcha.enabled' => true]);
    $this->post('/join', ['email' => 'captcha@example.com'])->assertBadRequest();
    expect(User::query()->where('email', 'captcha@example.com')->exists())->toBeFalse();
    Notification::assertNothingSent();
});

test('the setup token completes the standard password flow and cannot be reused', function (): void {
    $this->post('/join', ['email' => 'finish@example.com'])->assertRedirect('/join');
    $user = User::query()->where('email', 'finish@example.com')->sole();
    $message = Notification::sent($user, AccountCreated::class)->sole();
    $input = ['email' => $user->email, 'token' => $message->token, 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123'];
    $this->postJson(route('auth.reset-password'), $input)->assertOk();
    $this->assertAuthenticatedAs($user);
    $this->app->make('auth')->guard()->logout();
    $this->app->make('auth')->forgetGuards();
    $this->postJson(route('auth.reset-password'), $input)->assertBadRequest();
});

test('signed in members go straight to the panel without sending mail', function (): void {
    $this->actingAs(User::factory()->create());
    $this->get('/join')->assertRedirect('/');
    $this->post('/join', ['email' => 'another@example.com'])->assertRedirect('/');
    Notification::assertNothingSent();
});

test('invalid form input returns to a usable form', function (): void {
    $this->withHeader('Accept', 'text/html')->from('/join')->post('/join', ['email' => ['bad@example.com']])
        ->assertRedirect('/join')->assertSessionHasErrors('email');
    $this->get('/join')->assertOk()->assertSee('Send setup link')->assertSee('aria-invalid="true"', false);
    Notification::assertNothingSent();
});

test('creation failure shows a retry message without claiming success', function (): void {
    $this->mock(\Pterodactyl\Contracts\Users\CreatesUsers::class)
        ->shouldReceive('create')->once()->andThrow(new RuntimeException('Synthetic queue failure'));
    $this->post('/join', ['email' => 'failure@example.com'])->assertRedirect('/join')
        ->assertSessionHasErrors('email')->assertSessionMissing('setup_requested');
    $this->get('/join')->assertOk()->assertSee('We could not send the email.');
    Notification::assertNothingSent();
});

test('an in flight request owns the email lock', function (): void {
    $lock = Cache::lock('bw-onboarding:'.hash('sha256', 'locked@example.com').':lock', 30);
    expect($lock->get())->toBeTrue();
    try {
        $this->post('/join', ['email' => 'locked@example.com'])->assertRedirect('/join');
        expect(User::query()->where('email', 'locked@example.com')->exists())->toBeFalse();
        Notification::assertNothingSent();
    } finally {
        $lock->release();
    }
    $this->post('/join', ['email' => 'locked@example.com'])->assertRedirect('/join');
    expect(User::query()->where('email', 'locked@example.com')->count())->toBe(1);
    Notification::assertCount(1);
});

test('source address limit applies across different emails', function (): void {
    foreach (range(1, 20) as $index) {
        $this->postJson('/join', ['email' => 'invalid'])->assertUnprocessable();
    }
    $this->postJson('/join', ['email' => 'limited@example.com'])->assertTooManyRequests();
    Notification::assertNothingSent();
});
