#!/bin/sh
set -eu

# Railway (and most PaaS routers) inject PORT. Apache's default vhost listens
# on 80, so rewrite both the listener and the vhost before starting.
PORT="${PORT:-80}"
sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

mkdir -p \
    storage/app/private \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache

# Cache after the container receives its environment values. Migrations are
# safe to run on every boot and make the first deployment self-initializing.
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Set RUN_SEED=true for the first staging boot, then remove it. Re-running the
# seeders after CMS edits would overwrite the edited content.
if [ "${RUN_SEED:-false}" = "true" ]; then
    php artisan db:seed --force
fi

chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground
