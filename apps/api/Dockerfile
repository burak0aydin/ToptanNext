FROM node:20-alpine AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
ENV PRISMA_SCHEMA_PATH="/app/apps/api/prisma/schema.prisma"

RUN corepack enable && corepack prepare pnpm@8.15.8 --activate
RUN apk add --no-cache openssl

FROM base AS builder

# This Dockerfile is intentionally built from the repository root.
# DigitalOcean App Platform: set Source Directory to "/" and Dockerfile Path to "apps/api/Dockerfile".
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN pnpm install --frozen-lockfile --filter api...

COPY apps/api apps/api
COPY packages packages

RUN pnpm --dir apps/api exec prisma generate --schema /app/apps/api/prisma/schema.prisma
RUN pnpm --filter api run build

FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder /app /app

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["sh", "-c", "echo \"Starting ToptanNext API on port ${PORT:-3001}\" && pnpm --dir /app/apps/api exec prisma migrate deploy --schema /app/apps/api/prisma/schema.prisma && exec node /app/apps/api/dist/src/main.js"]
