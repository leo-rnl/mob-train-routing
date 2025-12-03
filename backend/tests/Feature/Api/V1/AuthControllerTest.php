<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_token_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/token', [
            'email' => 'test@mob.ch',
            'password' => 'password123',
            'device_name' => 'frontend',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'expiresAt',
            ]);

        $this->assertMatchesRegularExpression('/^\d+\|.+$/', $response->json('token'));
    }

    public function test_returns_401_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@mob.ch',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/token', [
            'email' => 'test@mob.ch',
            'password' => 'wrong_password',
            'device_name' => 'frontend',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);
    }

    public function test_returns_422_with_missing_fields(): void
    {
        $response = $this->postJson('/api/v1/auth/token', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password', 'device_name']);
    }

    public function test_returns_422_with_invalid_email_format(): void
    {
        $response = $this->postJson('/api/v1/auth/token', [
            'email' => 'not-an-email',
            'password' => 'password123',
            'device_name' => 'frontend',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_returns_401_for_non_existent_user(): void
    {
        $response = $this->postJson('/api/v1/auth/token', [
            'email' => 'nonexistent@mob.ch',
            'password' => 'password123',
            'device_name' => 'frontend',
        ]);

        $response->assertStatus(401);
    }
}
