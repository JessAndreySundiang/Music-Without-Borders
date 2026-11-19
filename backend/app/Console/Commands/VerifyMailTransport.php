<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class VerifyMailTransport extends Command
{
    protected $signature = 'mail:verify';

    protected $description = 'Verify the production mail transport can authenticate from this host';

    /**
     * Railway gives each deployment a new outbound IP. If Brevo still has
     * unknown-IP blocking enabled, the API key starts returning 401 after a
     * redeploy even though the key itself is valid. Failing the deploy keeps
     * the previous working container serving password resets and alerts.
     */
    public function handle(): int
    {
        if (config('mail.default') !== 'brevo') {
            $this->info('Mail transport is not Brevo; skipping the egress check.');

            return self::SUCCESS;
        }

        $key = trim((string) config('mail.mailers.brevo.key'));

        if ($key === '') {
            $this->error('BREVO_API_KEY is not configured.');

            return self::FAILURE;
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $key,
                'accept' => 'application/json',
            ])->timeout(15)->get('https://api.brevo.com/v3/account');
        } catch (Throwable $exception) {
            // A Brevo outage should not block a deployment; only an auth
            // rejection means this container cannot send mail.
            Log::warning('Brevo mail verification could not reach the API.', [
                'exception' => $exception::class,
            ]);
            $this->warn('Brevo could not be reached; continuing without blocking the deployment.');

            return self::SUCCESS;
        }

        if ($response->successful()) {
            $this->info('Brevo API authentication succeeded.');

            return self::SUCCESS;
        }

        if ($response->status() === 401) {
            $this->error('Brevo rejected the API key from this container (HTTP 401).');
            $this->line('Disable unknown-IP blocking for API keys in Brevo, or authorize this egress IP.');

            return self::FAILURE;
        }

        $this->warn("Brevo returned HTTP {$response->status()}; continuing without blocking the deployment.");

        return self::SUCCESS;
    }
}
