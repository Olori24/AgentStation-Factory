# syntax=docker/dockerfile:1
#
# AgentStation dedicated sandbox service image.
#
# This container runs `sandbox/server.mjs`, which accepts execution requests
# from the app over the compose network and runs each command in a throwaway,
# hardened container on the host Docker engine:
#
#   docker run --rm --network=none --read-only --cap-drop=ALL \
#     --security-opt=no-new-privileges --pids-limit=128 --memory=512m \
#     --cpus=1 --ipc=none --ulimit nofile=256:256 --user 65532:65532 \
#     -v <run-dir>:/workspace:rw -w /workspace <image> sh -lc "<command>"
#
# The Docker CLI is required; the daemon itself is reached through the mounted
# /var/run/docker.sock (see docker-compose.yml).

FROM docker:27-cli

RUN apk add --no-cache nodejs

WORKDIR /srv/sandbox
COPY server.mjs ./

ENV SANDBOX_PORT=7070

EXPOSE 7070

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.SANDBOX_PORT||7070)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "/srv/sandbox/server.mjs"]
