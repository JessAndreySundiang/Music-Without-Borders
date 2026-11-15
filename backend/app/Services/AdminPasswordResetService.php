<?php

namespace App\Services;

use App\Models\AdminPasswordReset;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminPasswordResetService
{
    public const LINK_FILE = 'admin-reset-link.txt';

    /**
     * Create a signed, single-use reset link and return it. The raw token is
     * never stored in the database; only its hash is persisted.
     */
    public function createLink(User $user): string
    {
        $email = Str::lower($user->email);
        $token = Str::random(64);
        $expires = now()->addMinutes(60);

        AdminPasswordReset::query()->updateOrCreate(
            ['email' => $email],
            [
                'token_hash' => hash('sha256', $token),
                'expires_at' => $expires,
                'created_at' => now(),
            ],
        );

        $signature = $this->signature($email, $token, $expires->timestamp);
        $base = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');

        return $base.'/admin/reset-password?'.http_build_query([
            'email' => $email,
            'token' => $token,
            'expires' => $expires->timestamp,
            'signature' => $signature,
        ]);
    }

    /**
     * The local demo has no mail transport, so the link is written to a private
     * storage file instead of being exposed in an API response or console log.
     */
    public function writeLinkToStorage(string $link): void
    {
        Storage::disk('local')->put(self::LINK_FILE, $link.PHP_EOL);
    }

    /**
     * @throws ValidationException
     */
    public function reset(
        string $email,
        string $token,
        int $expires,
        string $signature,
        string $password,
    ): User {
        $email = Str::lower($email);

        if (! hash_equals($this->signature($email, $token, $expires), $signature)) {
            throw ValidationException::withMessages([
                'token' => 'This password reset link is not valid.',
            ]);
        }

        if ($expires < now()->timestamp) {
            throw ValidationException::withMessages([
                'token' => 'This password reset link has expired.',
            ]);
        }

        $reset = AdminPasswordReset::query()->where('email', $email)->first();

        if (! $reset || ! hash_equals($reset->token_hash, hash('sha256', $token))) {
            throw ValidationException::withMessages([
                'token' => 'This password reset link has already been used or is invalid.',
            ]);
        }

        if ($reset->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'token' => 'This password reset link has expired.',
            ]);
        }

        $user = User::query()
            ->where('email', $email)
            ->where('is_admin', true)
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'No administrator account matches this link.',
            ]);
        }

        $user->forceFill(['password' => Hash::make($password)])->save();
        $user->tokens()->delete();
        $reset->delete();

        return $user;
    }

    private function signature(string $email, string $token, int $expires): string
    {
        return hash_hmac(
            'sha256',
            $email.'|'.$token.'|'.$expires,
            (string) config('app.key'),
        );
    }
}
