FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/worker ./apps/worker
COPY packages/shared ./packages/shared

# Build shared package
RUN pnpm --filter shared build

# Build worker app
RUN pnpm --filter worker build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/apps/worker/package.json ./apps/worker/
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/node_modules ./node_modules

CMD ["pnpm", "--filter", "worker", "start"]