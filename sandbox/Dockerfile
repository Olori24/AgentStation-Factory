FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip git ca-certificates \
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

ENTRYPOINT ["sh"]
