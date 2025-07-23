# /Users/kyleessenmacher/WS/go-convex-telegram-turborepo/apps/web/Dockerfile
# Stage 0: Base image with pnpm
FROM node:20-alpine AS base

# Accept build args for runtime
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_WS_URL
ARG CONVEX_HTTP_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ARG CONVEX_URL
ARG NEXT_PUBLIC_VECTOR_CONVERT_MODEL
ARG NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL
ARG NEXT_PUBLIC_LLM_MODEL
ARG NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL

ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_CONVEX_WS_URL=${NEXT_PUBLIC_CONVEX_WS_URL}
ENV CONVEX_HTTP_URL=${CONVEX_HTTP_URL}
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
ENV CONVEX_URL=${CONVEX_URL}
ENV NEXT_PUBLIC_VECTOR_CONVERT_MODEL=${NEXT_PUBLIC_VECTOR_CONVERT_MODEL}
ENV NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL=${NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL}
ENV NEXT_PUBLIC_LLM_MODEL=${NEXT_PUBLIC_LLM_MODEL}
ENV NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL=${NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL}

# Install system dependencies and pnpm
RUN apk update && apk upgrade --no-cache \
    && apk add --no-cache libc6-compat bash curl \
    && npm install -g pnpm@latest \
    && rm -rf /var/cache/apk/*

# Stage 1: Install dependencies & codegen (monorepo root)
FROM base AS builder

WORKDIR /app

# Copy workspace manifest and lockfiles
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy web app manifest, docker-convex manifest, and shared packages
COPY apps/web/package.json apps/web/
COPY apps/docker-convex/package.json apps/docker-convex/
COPY packages ./packages

# If Convex _generated files exist in docker-convex, bring them into web
# RUN mkdir -p apps/web/convex/_generated \
#     && if [ -d "apps/docker-convex/convex/_generated" ]; then \
#         cp -r apps/docker-convex/convex/_generated/* apps/web/convex/_generated/; \
#     fi

# Install full monorepo dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the web app source code, docker-convex convex functions, and necessary shared files
COPY apps/web ./apps/web
COPY apps/docker-convex/convex ./apps/docker-convex/convex
COPY packages ./packages
COPY turbo.json ./turbo.json
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml

# Add environment variables for build process
ENV TELEGRAM_BOT_TOKEN=""
ENV CONVEX_URL=${CONVEX_URL:-"http://localhost:3210"}

# Build only the web app
WORKDIR /app/apps/web
RUN pnpm build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/apps/web

# Set production env
ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthchecks and pnpm for runtime
RUN apk add --no-cache curl \
    && npm install -g pnpm@latest

# Copy built output, package manifest, and dependencies
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy global node_modules (monorepo root) for runtime dependencies
COPY --from=builder /app/node_modules ./node_modules

# Expose port and run
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
