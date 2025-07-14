# Optimized Dockerfile for faster builds
FROM node:20-alpine AS base

# Accept build arguments
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}

# Install system dependencies and pnpm in one layer
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat bash && \
    npm install -g pnpm@latest && \
    rm -rf /var/cache/apk/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install pnpm is already done in base
# Copy workspace configuration
COPY . .

# Copy Convex generated files if they exist
RUN mkdir -p ./apps/web/convex/_generated
RUN if [ -d "apps/docker-convex/convex/_generated" ]; then \
    cp -r apps/docker-convex/convex/_generated/* ./apps/web/convex/_generated/ || true; \
    else echo "No generated files to copy yet"; fi

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure Convex generated files are available
RUN mkdir -p ./apps/web/convex/_generated
RUN if [ -d "/app/apps/web/convex/_generated" ]; then \
    cp -r /app/apps/web/convex/_generated/* ./apps/web/convex/_generated/ || true; \
    else echo "No generated files to copy from deps"; fi

# Build the application
WORKDIR /app/apps/web

RUN pnpm build

# Production image - minimal runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Create non-root user and setup directories in one layer
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir .next && \
    chown nextjs:nodejs .next

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]