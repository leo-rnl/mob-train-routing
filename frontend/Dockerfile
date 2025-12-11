# =============================================================================
# Stage 1: Build the application
# =============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL (can be overridden at build time)
ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# =============================================================================
# Stage 2: Production image with Nginx
# =============================================================================
FROM nginx:alpine AS production

# Update system packages to fix known vulnerabilities (libpng, busybox)
RUN apk upgrade --no-cache

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-app nginx-app && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Labels
LABEL org.opencontainers.image.title="MOB Train Routing Frontend" \
    org.opencontainers.image.description="Vue.js frontend for train route calculations" \
    org.opencontainers.image.vendor="MOB" \
    org.opencontainers.image.source="https://github.com/leornl/mob-train-routing"

CMD ["nginx", "-g", "daemon off;"]
