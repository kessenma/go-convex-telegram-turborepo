# Optimized Dockerfile for a monorepo web-dashboard build

# Stage 0: Base image with pnpm
FROM node:20-alpine AS base

# Accept build arguments for runtime injection
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}

# Install system dependencies and pnpm
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat bash && \
    npm install -g pnpm@latest && \
    rm -rf /var/cache/apk/*

# Stage 1: Install dependencies (monorepo root)
FROM base AS deps
WORKDIR /app

# Copy only manifests for install caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web/package.json apps/web/

# Copy Convex-generated files if they exist
RUN mkdir -p apps/web/convex/_generated && \
    if [ -d "apps/docker-convex/convex/_generated" ]; then \
      cp -r apps/docker-convex/convex/_generated/* apps/web/convex/_generated/; \
    fi

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build web app
FROM base AS builder
WORKDIR /app

# Bring in installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy rest of monorepo
COPY . .

# Mirror node_modules into web app folder so pnpm/next can use them
RUN cp -R node_modules apps/web/node_modules

# Ensure generated Convex API files are in place
RUN mkdir -p apps/web/convex/_generated && \
    if [ -d "/app/apps/web/convex/_generated" ]; then \
      cp -r /app/apps/web/convex/_generated/* apps/web/convex/_generated/; \
    fi

# Build the Next.js application
WORKDIR /app/apps/web
RUN pnpm build

# Stage 3: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app/apps/web

# Set environment for production
ENV NODE_ENV=production

# Copy build output and dependencies
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/node_modules ./node_modules

# Expose default Next.js port
EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]