<?php

namespace App\Providers;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoApiTransport;
use Symfony\Component\Mailer\Transport\TransportInterface;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Laravel has no built-in Brevo transport. Railway blocks outbound SMTP,
        // so the API transport is the production path; local SMTP stays available
        // for developers who prefer it.
        Mail::extend('brevo', function (array $config): TransportInterface {
            $key = trim((string) ($config['key'] ?? ''));

            if ($key === '') {
                throw new InvalidArgumentException('BREVO_API_KEY is not configured.');
            }

            return new BrevoApiTransport($key);
        });
    }
}
