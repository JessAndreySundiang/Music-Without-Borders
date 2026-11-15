<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AdminPasswordResetService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminSetupLink extends Command
{
    protected $signature = 'admin:setup-link';

    protected $description = 'Create the administrator account if needed and write a one-time setup link to private storage';

    public function handle(AdminPasswordResetService $resets): int
    {
        $email = Str::lower((string) config('app.admin_email', 'Communitymusicband@gmail.com'));
        $name = (string) config('app.admin_name', 'Community Music Band Admin');

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make(Str::random(64)),
                'is_admin' => true,
            ],
        );

        if (! $user->is_admin || $user->name !== $name) {
            $user->forceFill(['is_admin' => true, 'name' => $name])->save();
        }

        $resets->writeLinkToStorage($resets->createLink($user));

        $this->info('Administrator account is ready for '.$email.'.');
        $this->info('A one-time setup link was written to '.Storage::disk('local')->path(AdminPasswordResetService::LINK_FILE).'.');
        $this->line('Open that file locally and use the link in the browser. It expires in 60 minutes and can be used once.');

        return self::SUCCESS;
    }
}
