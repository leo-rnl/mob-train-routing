# =============================================================================
# Stage 1: Composer dependencies
# =============================================================================
FROM composer:2 AS composer

WORKDIR /app

# Copy only composer files for better caching
COPY composer.json composer.lock ./

# Install dependencies without dev packages
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy application code
COPY . .

# Remove cached package manifest (may contain dev packages)
RUN rm -f bootstrap/cache/*.php

# Generate optimized autoloader and rediscover packages
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi

# =============================================================================
# Stage 2: Production image with PHP-FPM and Nginx
# =============================================================================
FROM php:8.4-fpm-alpine AS production

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    zip \
    opcache \
    && rm -rf /var/cache/apk/*

# Configure PHP for production
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Configure OPcache for production
RUN echo "opcache.enable=1" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.memory_consumption=128" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.interned_strings_buffer=8" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.max_accelerated_files=10000" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.validate_timestamps=0" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.save_comments=1" >> "$PHP_INI_DIR/conf.d/opcache.ini"

# Set working directory
WORKDIR /var/www/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy application from composer stage
COPY --from=composer /app/vendor ./vendor
COPY . .

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Copy entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create required directories
RUN mkdir -p /run/nginx /var/log/supervisor

# Expose port 80 (nginx)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Labels
LABEL org.opencontainers.image.title="MOB Train Routing Backend" \
    org.opencontainers.image.description="Laravel API for train route calculations" \
    org.opencontainers.image.vendor="MOB" \
    org.opencontainers.image.source="https://github.com/leornl/mob-train-routing"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
