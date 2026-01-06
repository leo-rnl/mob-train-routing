<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\AuthServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Requests\Api\V1\TokenRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthServiceInterface $authService
    ) {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->validated())) {
            return response()->json([
                'message' => 'Identifiants invalides',
            ], 401);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => Auth::user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Handle Bearer token logout (revoke current token if it's a real token)
        if ($user) {
            $token = $user->currentAccessToken();
            if ($token instanceof PersonalAccessToken) {
                $token->delete();
            }
        }

        // Handle session-based logout if session exists
        if ($request->hasSession()) {
            /** @var \Illuminate\Contracts\Auth\StatefulGuard $guard */
            $guard = Auth::guard('web');
            $guard->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Déconnexion réussie',
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function token(TokenRequest $request): JsonResponse
    {
        /** @var array{email: string, password: string, device_name: string} $validated */
        $validated = $request->validated();

        $result = $this->authService->authenticateAndCreateToken(
            $validated['email'],
            $validated['password'],
            $validated['device_name']
        );

        if ($result === null) {
            return response()->json([
                'message' => 'Identifiants invalides',
            ], 401);
        }

        return response()->json($result);
    }
}
