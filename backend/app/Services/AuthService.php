<?php

namespace App\Services;

use App\Contracts\AuthServiceInterface;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService implements AuthServiceInterface
{
    /**
     * @inheritDoc
     */
    public function authenticateAndCreateToken(
        string $email,
        string $password,
        string $deviceName
    ): ?array {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return null;
        }

        $token = $user->createToken($deviceName);

        return [
            'token' => $token->plainTextToken,
            'expires_at' => null,
        ];
    }
}
