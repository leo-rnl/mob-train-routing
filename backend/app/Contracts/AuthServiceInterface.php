<?php

namespace App\Contracts;

interface AuthServiceInterface
{
    /**
     * Authenticate user and create a personal access token.
     *
     * @return array{token: string, expires_at: null}|null Returns null if authentication fails
     */
    public function authenticateAndCreateToken(
        string $email,
        string $password,
        string $deviceName
    ): ?array;
}
