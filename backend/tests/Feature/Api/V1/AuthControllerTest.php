<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Session/Cookie Authentication Tests (Stateful)
    // Original tests - DO NOT MODIFY without good reason
    // =========================================================================

    /**
     * Set up headers for stateful API requests.
     */
    protected function statefulHeaders(): array
    {
        return ['Referer' => 'http://localhost:3000'];
    }

    public function test_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/v1/login', [
                'email' => 'test@mob.ch',
                'password' => 'password123',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
            ])
            ->assertJsonPath('user.email', 'test@mob.ch');

        $this->assertAuthenticatedAs($user);
    }

    public function test_returns_401_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/v1/login', [
                'email' => 'test@mob.ch',
                'password' => 'wrong_password',
            ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);

        $this->assertGuest();
    }

    public function test_returns_422_with_missing_fields(): void
    {
        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/v1/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_returns_422_with_invalid_email_format(): void
    {
        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/v1/login', [
                'email' => 'not-an-email',
                'password' => 'password123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_returns_401_for_non_existent_user(): void
    {
        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/v1/login', [
                'email' => 'nonexistent@mob.ch',
                'password' => 'password123',
            ]);

        $response->assertStatus(401);
    }

    public function test_can_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        // Login first to establish session
        $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/v1/login', [
                'email' => 'test@mob.ch',
                'password' => 'password123',
            ])->assertStatus(200);

        // Logout
        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/v1/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out',
            ]);
    }

    public function test_logout_requires_authentication(): void
    {
        $response = $this->withHeaders($this->statefulHeaders())
            ->postJson('/api/v1/logout');

        $response->assertStatus(401);
    }

    public function test_can_get_authenticated_user(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@mob.ch',
        ]);

        $response = $this->actingAs($user)
            ->withHeaders($this->statefulHeaders())
            ->getJson('/api/v1/user');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
            ])
            ->assertJsonPath('user.name', 'Test User')
            ->assertJsonPath('user.email', 'test@mob.ch');
    }

    public function test_user_endpoint_requires_authentication(): void
    {
        $response = $this->withHeaders($this->statefulHeaders())
            ->getJson('/api/v1/user');

        $response->assertStatus(401);
    }

    // =========================================================================
    // Bearer Token Authentication Tests (Stateless - OpenAPI Compliant)
    // Added for /api/v1/auth/token endpoint
    // =========================================================================

    public function test_token_returns_bearer_token_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/token', [
            'email' => 'test@mob.ch',
            'password' => 'password123',
            'device_name' => 'phpunit',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'expires_at'])
            ->assertJson(['expires_at' => null]);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_token_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/token', [
            'email' => 'test@mob.ch',
            'password' => 'wrong_password',
            'device_name' => 'phpunit',
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Invalid credentials']);
    }

    public function test_token_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/auth/token', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password', 'device_name']);
    }

    public function test_token_validates_email_format(): void
    {
        $response = $this->postJson('/api/v1/auth/token', [
            'email' => 'not-an-email',
            'password' => 'password123',
            'device_name' => 'phpunit',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_token_rejects_non_existent_user(): void
    {
        $response = $this->postJson('/api/v1/auth/token', [
            'email' => 'nonexistent@mob.ch',
            'password' => 'password123',
            'device_name' => 'phpunit',
        ]);

        $response->assertStatus(401);
    }

    public function test_bearer_token_authenticates_api_requests(): void
    {
        User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $tokenResponse = $this->postJson('/api/v1/auth/token', [
            'email' => 'test@mob.ch',
            'password' => 'password123',
            'device_name' => 'phpunit',
        ]);

        $token = $tokenResponse->json('token');

        $response = $this->getJson('/api/v1/stations', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200);
    }

    public function test_bearer_token_can_access_user_endpoint(): void
    {
        User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $tokenResponse = $this->postJson('/api/v1/auth/token', [
            'email' => 'test@mob.ch',
            'password' => 'password123',
            'device_name' => 'phpunit',
        ]);

        $token = $tokenResponse->json('token');

        $response = $this->getJson('/api/v1/user', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.email', 'test@mob.ch');
    }

    public function test_bearer_token_logout_revokes_token(): void
    {
        User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $tokenResponse = $this->postJson('/api/v1/auth/token', [
            'email' => 'test@mob.ch',
            'password' => 'password123',
            'device_name' => 'phpunit',
        ]);

        $token = $tokenResponse->json('token');

        // Verify token exists in database before logout
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // Logout with Bearer token
        $response = $this->postJson('/api/v1/logout', [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out']);

        // Token should be deleted from database
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_invalid_bearer_token_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/stations', [
            'Authorization' => 'Bearer invalid-token',
        ]);

        $response->assertStatus(401);
    }
}
