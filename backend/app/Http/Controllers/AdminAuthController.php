<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AdminPasswordResetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', Str::lower($credentials['email']))
            ->where('is_admin', true)
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'The email or password is incorrect.',
            ], 422);
        }

        $token = $user->createToken('admin-dashboard', ['admin'])->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => $this->userPayload($user),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->userPayload($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Signed out.']);
    }

    public function forgotPassword(Request $request, AdminPasswordResetService $resets): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()
            ->where('email', Str::lower((string) $request->input('email')))
            ->where('is_admin', true)
            ->first();

        if ($user) {
            $resets->writeLinkToStorage($resets->createLink($user));
        }

        // Always return the same message so this endpoint cannot be used to
        // enumerate administrator accounts.
        return response()->json([
            'message' => 'If that email belongs to an administrator, a one-time reset link has been prepared.',
        ]);
    }

    public function resetPassword(Request $request, AdminPasswordResetService $resets): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'expires' => ['required', 'integer'],
            'signature' => ['required', 'string'],
            'password' => ['required', 'string', 'min:10', 'confirmed'],
        ]);

        $resets->reset(
            $data['email'],
            $data['token'],
            (int) $data['expires'],
            $data['signature'],
            $data['password'],
        );

        return response()->json([
            'message' => 'Your password has been updated. You can sign in now.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(?User $user): array
    {
        return [
            'id' => $user?->id,
            'name' => $user?->name,
            'email' => $user?->email,
            'is_admin' => (bool) $user?->is_admin,
        ];
    }
}
