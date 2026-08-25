# syntax=docker/dockerfile:1.7

FROM composer:2@sha256:4d71c3c2109c61d5415544264b59ad4087e4c5b7244481723664138fd36d5040 AS production-dependencies

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --prefer-dist \
    --classmap-authoritative \
    --ignore-platform-req=ext-pcntl

FROM production-dependencies AS production-autoload

COPY app ./app
COPY database ./database

RUN composer dump-autoload \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --classmap-authoritative

FROM serversideup/php:8.4-fpm-nginx@sha256:bde1b43716665cab6e07e38f3387627f8f38d408b7725a71903f0960156b900c AS runtime

ENV APP_BASE_DIR=/var/www/html \
    AUTORUN_ENABLED=false \
    HEALTHCHECK_PATH=/api/v1/health \
    NGINX_WEBROOT=/var/www/html/public \
    SSL_MODE=off

WORKDIR /var/www/html

USER root

RUN mkdir -p \
        bootstrap/cache \
        storage/app/private \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/testing \
        storage/framework/views \
        storage/logs \
        vendor \
    && chown -R www-data:www-data bootstrap/cache storage vendor

USER www-data

FROM runtime AS development

ENV APP_ENV=local \
    PHP_DISPLAY_ERRORS=On \
    PHP_DISPLAY_STARTUP_ERRORS=On

COPY --chown=www-data:www-data . .

FROM runtime AS production

ENV APP_ENV=production \
    APP_DEBUG=false \
    PHP_DISPLAY_ERRORS=Off \
    PHP_DISPLAY_STARTUP_ERRORS=Off \
    PHP_OPCACHE_ENABLE=1

COPY --chown=www-data:www-data . .
COPY --from=production-autoload --chown=www-data:www-data /app/vendor ./vendor

RUN php artisan package:discover --ansi

USER root

RUN rm -f /usr/bin/composer /usr/local/bin/composer

USER www-data
