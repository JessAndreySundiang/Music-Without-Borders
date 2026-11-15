<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AdminPasswordResetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_can_sign_in_and_read_their_profile(): void
    {
        $admin = $this->admin();

        $login = $this->postJson('/api/admin/login', [
            'email' => $admin->email,
            'password' => 'correct-password',
        ])->assertOk();

        $token = $login->json('data.token');
        $this->assertNotEmpty($token);

        $this->withToken($token)
            ->getJson('/api/admin/me')
            ->assertOk()
            ->assertJsonPath('data.email', $admin->email)
            ->assertJsonPath('data.is_admin', true);
    }

    public function test_non_admins_and_bad_passwords_are_rejected(): void
    {
        User::query()->create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => Hash::make('correct-password'),
            'is_admin' => false,
        ]);

        $this->postJson('/api/admin/login', [
            'email' => 'user@example.com',
            'password' => 'correct-password',
        ])->assertUnprocessable();

        $this->postJson('/api/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }

    public function test_a_signed_reset_link_can_be_used_once(): void
    {
        $admin = $this->admin();
        $link = app(AdminPasswordResetService::class)->createLink($admin);
        parse_str((string) parse_url($link, PHP_URL_QUERY), $query);

        $payload = [
            'email' => $query['email'],
            'token' => $query['token'],
            'expires' => $query['expires'],
            'signature' => $query['signature'],
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ];

        $this->postJson('/api/admin/reset-password', $payload)->assertOk();
        $this->assertTrue(Hash::check('new-secure-password', $admin->fresh()->password));

        $this->postJson('/api/admin/reset-password', $payload)->assertUnprocessable();
    }

    public function test_the_forgot_password_endpoint_does_not_reveal_whether_an_account_exists(): void
    {
        $this->postJson('/api/admin/forgot-password', [
            'email' => 'missing@example.com',
        ])->assertOk()
            ->assertJsonPath('message', 'If that email belongs to an administrator, a one-time reset link has been prepared.');
    }

    private function admin(): User
    {
        return User::query()->create([
            'name' => 'Test Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('correct-password'),
            'is_admin' => true,
        ]);
    }
}
