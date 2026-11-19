<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VerifyMailTransportTest extends TestCase
{
    public function test_it_passes_when_brevo_accepts_the_key(): void
    {
        config([
            'mail.default' => 'brevo',
            'mail.mailers.brevo.key' => 'test-brevo-key',
        ]);
        Http::fake([
            'api.brevo.com/*' => Http::response(['email' => 'admin@example.com'], 200),
        ]);

        $this->artisan('mail:verify')
            ->expectsOutputToContain('Brevo API authentication succeeded.')
            ->assertExitCode(0);

        Http::assertSent(fn ($request) => $request->hasHeader('api-key', 'test-brevo-key'));
    }

    public function test_it_fails_when_brevo_rejects_the_egress_ip(): void
    {
        config([
            'mail.default' => 'brevo',
            'mail.mailers.brevo.key' => 'test-brevo-key',
        ]);
        Http::fake([
            'api.brevo.com/*' => Http::response(['message' => 'unrecognised IP address'], 401),
        ]);

        $this->artisan('mail:verify')
            ->expectsOutputToContain('Disable unknown-IP blocking for API keys in Brevo')
            ->assertExitCode(1);
    }

    public function test_it_does_not_block_a_deployment_when_brevo_is_unavailable(): void
    {
        config([
            'mail.default' => 'brevo',
            'mail.mailers.brevo.key' => 'test-brevo-key',
        ]);
        Http::fake([
            'api.brevo.com/*' => Http::response('', 503),
        ]);

        $this->artisan('mail:verify')
            ->expectsOutputToContain('continuing without blocking the deployment')
            ->assertExitCode(0);
    }

    public function test_it_fails_when_the_brevo_key_is_missing(): void
    {
        config([
            'mail.default' => 'brevo',
            'mail.mailers.brevo.key' => '',
        ]);

        $this->artisan('mail:verify')
            ->expectsOutputToContain('BREVO_API_KEY is not configured.')
            ->assertExitCode(1);
    }

    public function test_it_skips_when_the_mailer_is_not_brevo(): void
    {
        config(['mail.default' => 'array']);
        Http::fake();

        $this->artisan('mail:verify')
            ->expectsOutputToContain('skipping the egress check')
            ->assertExitCode(0);

        Http::assertNothingSent();
    }
}
