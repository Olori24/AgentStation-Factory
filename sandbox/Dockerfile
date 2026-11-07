# AgentStation hardened sandbox runtime image.
#
# Used when SANDBOX_RUNTIME=docker. The runner launches this image as:
#   docker run --rm --network=none --read-only --cap-drop=ALL \
#     --security-opt=no-new-privileges --pids-limit=128 --memory=512m \
#     --cpus=1 --ipc=none --user 65532:65532 \
#     -v <run-dir>:/workspace:rw -w /workspace <image> sh -lc "<command>"
#
# The command is supplied by the runner, so this image intentionally defines no
# ENTRYPOINT (an ENTRYPOINT would be prepended to the runner's `sh -lc ...`).
#
# Build it with:  npm run sandbox:build
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-pytest git ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 65532 sandbox \
  && useradd --uid 65532 --gid 65532 --create-home --home-dir /home/sandbox --shell /bin/sh sandbox

WORKDIR /workspace
RUN chown 65532:65532 /workspace

ENV HOME=/tmp
ENV NODE_ENV=test
ENV CI=true
ENV PYTHONUNBUFFERED=1

USER 65532:65532

CMD ["sh", "-lc", "echo 'AgentStation sandbox ready'"]
