# syntax=docker/dockerfile:1

FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --no-dev

FROM php:8.4-fpm-alpine AS app

RUN apk update && apk add --no-cache \
        nginx \
        python3 \
        py3-pip \
        postgresql-client \
        postgresql-dev \
        libzip-dev \
        libpng-dev \
        icu-dev \
        oniguruma \
        oniguruma-dev \
        ca-certificates \
        iputils \
    && pip3 install --no-cache-dir --break-system-packages supervisor \
    && docker-php-ext-install \
        pdo_pgsql \
        zip \
        gd \
        intl \
        mbstring \
        bcmath \
    && echo "net.ipv6.conf.all.disable_ipv6 = 0" >> /etc/sysctl.conf \
    && rm -rf /var/cache/apk/*

WORKDIR /var/www/html

COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=assets /app/public/build ./public/build

RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/framework/testing bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-cakehub-uploads.ini
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
