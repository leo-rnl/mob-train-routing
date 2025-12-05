#!/bin/sh
set -e

echo "Starting MOB Train Routing Backend..."

# Wait for database to be ready
echo "Waiting for database connection..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if php artisan db:monitor --databases=pgsql > /dev/null 2>&1; then
        echo "Database is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "Warning: Could not verify database connection, continuing anyway..."
fi

# Run migrations if AUTO_MIGRATE is set
if [ "${AUTO_MIGRATE:-false}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force
fi

# Clear and cache configuration for production
echo "Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper permissions on storage
chown -R www-data:www-data /var/www/html/storage
chmod -R 775 /var/www/html/storage

echo "Application ready!"

# Execute the main command
exec "$@"
