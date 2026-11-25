<?php

namespace App\Console\Commands;

use App\Models\HomeSection;
use App\Models\Performance;
use App\Models\Story;
use App\Models\User;
use Illuminate\Console\Command;
use Throwable;

class LocalBootstrap extends Command
{
    protected $signature = 'local:bootstrap';

    protected $description = 'Prepare the local database (migrate, seed if empty, and prepare admin setup if missing)';

    public function handle(): int
    {
        if (app()->environment('production')) {
            $this->error('local:bootstrap cannot run in production.');

            return self::FAILURE;
        }

        if (config('database.default') === 'sqlite') {
            $database = (string) config('database.connections.sqlite.database');

            if ($database !== '' && $database !== ':memory:') {
                $directory = dirname($database);
                if (! is_dir($directory)) {
                    @mkdir($directory, 0775, true);
                }
                if (! file_exists($database)) {
                    @touch($database);
                }
            }
        }

        try {
            $this->call('migrate', ['--force' => true]);
        } catch (Throwable $exception) {
            $connection = (string) config('database.default');
            $this->error("Database connection '{$connection}' is not ready: {$exception->getMessage()}");
            $this->line('Ensure the configured database service is running, or set DB_CONNECTION=sqlite in backend/.env.');

            return self::FAILURE;
        }

        $hasContent = HomeSection::query()->exists()
            || Story::query()->exists()
            || Performance::query()->exists();

        if (! $hasContent) {
            $this->call('db:seed', ['--force' => true]);
            $this->info('Seeded initial CMS content, performances, and stories.');
        }

        if (! User::query()->where('is_admin', true)->exists()) {
            $this->call('admin:setup-link');
        }

        return self::SUCCESS;
    }
}
