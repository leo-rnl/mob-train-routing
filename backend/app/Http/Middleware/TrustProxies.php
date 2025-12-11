<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

/**
 * Trust proxies middleware for Traefik reverse proxy.
 *
 * This middleware ensures Laravel correctly detects HTTPS when behind
 * Traefik, which handles TLS termination and forwards requests over HTTP.
 */
class TrustProxies extends Middleware
{
    /**
     * The trusted proxies for this application.
     *
     * Using '*' is acceptable in a Docker internal network where only
     * Traefik can reach the backend container.
     *
     * @var array<int, string>|string|null
     */
    protected $proxies = '*';

    /**
     * The headers that should be used to detect proxies.
     *
     * @var int
     */
    protected $headers =
        Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO |
        Request::HEADER_X_FORWARDED_AWS_ELB;
}
