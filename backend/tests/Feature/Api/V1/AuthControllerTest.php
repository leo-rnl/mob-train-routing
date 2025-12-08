<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

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
}
