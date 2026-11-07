# syntax=docker/dockerfile:1
#
# AgentStation Factory application image.
#
# Runs the full-stack server (`tsx server.ts`) in development mode so the
# Vite middleware serves the command-deck UI and the JSON storage backend is
# used — exactly like `npm run dev` on a laptop, but sealed in a container.
#
# Sandbox execution is NOT performed here. In the Docker Compose dev profile
# the app hands commands to the dedicated `sandbox` service over the compose
# network (SANDBOX_RUNTIME=remote); this image has no Docker socket and no
# container engine.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=development \
    PORT=3000 \
    HOME=/home/node

# git: repository tooling for mission deliverables.
# python3: in-process helper scripts used by a few server utilities.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Writable state directories, owned by the unprivileged runtime user.
RUN mkdir -p data workspace dist \
  && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "dev"]
