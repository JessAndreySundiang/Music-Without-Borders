<?php

namespace Tests\Feature;

use App\Console\Commands\LocalBootstrap;
use App\Models\HomeSection;
use App\Models\Performance;
use App\Models\Story;
use App\Models\User;
use App\Services\AdminPasswordResetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LocalBootstrapCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_local_bootstrap_seeds_empty_database_and_prepares_admin_link(): void
    {
        Storage::fake('local');

        $this->assertSame(0, HomeSection::query()->count());
        $this->assertSame(0, Story::query()->count());
        $this->assertSame(0, Performance::query()->count());
        $this->assertSame(0, User::query()->count());

        $this->artisan('local:bootstrap')->assertSuccessful();

        $this->assertGreaterThan(0, HomeSection::query()->count());
        $this->assertGreaterThanOrEqual(3, Story::query()->approved()->count());
        $this->assertGreaterThan(0, Performance::query()->count());
        $this->assertTrue(User::query()->where('is_admin', true)->exists());
        Storage::disk('local')->assertExists(AdminPasswordResetService::LINK_FILE);
    }

    public function test_local_bootstrap_is_idempotent_and_preserves_existing_data(): void
    {
        Storage::fake('local');

        $this->artisan('local:bootstrap')->assertSuccessful();

        $story = Story::query()->firstOrFail();
        $story->update(['title' => 'Edited Story Title']);

        $admin = User::query()->where('is_admin', true)->firstOrFail();
        $admin->forceFill(['password' => Hash::make('existing-custom-password')])->save();

        Storage::disk('local')->delete(AdminPasswordResetService::LINK_FILE);

        $this->artisan('local:bootstrap')->assertSuccessful();

        $this->assertSame('Edited Story Title', $story->fresh()->title);
        $this->assertTrue(Hash::check('existing-custom-password', $admin->fresh()->password));
        Storage::disk('local')->assertMissing(AdminPasswordResetService::LINK_FILE);
    }

    public function test_local_bootstrap_refuses_to_run_in_production(): void
    {
        $this->app->detectEnvironment(fn () => 'production');

        $this->artisan('local:bootstrap')->assertFailed();
    }

    public function test_local_bootstrap_quotes_mysql_identifiers_and_reports_unreachable_mysql(): void
    {
        $this->assertSame('`community_band_db`', LocalBootstrap::quoteMysqlIdentifier('community_band_db'));
        $this->assertSame('`bad``name`', LocalBootstrap::quoteMysqlIdentifier('bad`name'));

        $previousDefault = config('database.default');
        $previousHost = config('database.connections.mysql.host');
        $previousPort = config('database.connections.mysql.port');

        try {
            Config::set('database.default', 'mysql');
            Config::set('database.connections.mysql.host', '127.0.0.1');
            Config::set('database.connections.mysql.port', 65432);

            $this->artisan('local:bootstrap')
                ->expectsOutputToContain("Database connection 'mysql' is not ready")
                ->assertFailed();
        } finally {
            Config::set('database.connections.mysql.host', $previousHost);
            Config::set('database.connections.mysql.port', $previousPort);
            Config::set('database.default', $previousDefault);
        }
    }
}
