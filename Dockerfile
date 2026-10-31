# syntax=docker/dockerfile:1.7
# Build in CI. Production hosts only pull the resulting immutable image.
ARG NODE_BASE_IMAGE=node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914
FROM ${NODE_BASE_IMAGE} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=3072
ARG RELEASE_ID=local
ENV RELEASE_ID=$RELEASE_ID
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# The stable Server Actions key is a BuildKit secret, never a build argument.
RUN --mount=type=secret,id=next_actions_key \
    --mount=type=secret,id=sentry_auth_token \
    if [ -s /run/secrets/next_actions_key ]; then export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(cat /run/secrets/next_actions_key)"; fi; \
    if [ -s /run/secrets/sentry_auth_token ]; then export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; fi; \
    npm run build

FROM ${NODE_BASE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN apk add --no-cache wget && addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=45s \
  CMD wget -q -O /dev/null -T 4 http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
