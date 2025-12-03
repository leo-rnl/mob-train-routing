<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Laravel\Sanctum\NewAccessToken;

/**
 * @property NewAccessToken $resource
 */
class TokenResource extends JsonResource
{
    /**
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var \DateTimeInterface|null $expiresAt */
        $expiresAt = $this->resource->accessToken->getAttribute('expires_at');

        return [
            'token' => $this->resource->plainTextToken,
            'expiresAt' => $expiresAt,
        ];
    }
}
