<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoApiTransport;
use Tests\TestCase;

class MailConfigurationTest extends TestCase
{
    public function test_the_brevo_mailer_uses_the_https_api_transport(): void
    {
        config(['mail.mailers.brevo.key' => 'test-brevo-key']);

        $transport = Mail::mailer('brevo')->getSymfonyTransport();

        $this->assertInstanceOf(BrevoApiTransport::class, $transport);
    }

    public function test_the_brevo_mailer_reports_a_missing_api_key(): void
    {
        config(['mail.mailers.brevo.key' => '']);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('BREVO_API_KEY is not configured.');

        Mail::mailer('brevo');
    }
}
