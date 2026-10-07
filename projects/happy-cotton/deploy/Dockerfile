# The image deploy/update-site.sh exports the web build in: the pinned Godot and its web export
# templates, installed by scripts/setup-godot.sh (checksum-verified), so the server needs only Docker.
# Build context: the project's scripts/ folder.
ARG BASE_IMAGE=ubuntu:24.04@sha256:534baea6a22c03a63003dbc8dbe78fe34bc0d7e595d9a9dc9834884ff530eb55
FROM ${BASE_IMAGE}

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl libfontconfig1 unzip \
  && rm -rf /var/lib/apt/lists/*

# Templates live outside HOME so the export can run as any user with HOME=/tmp.
ENV XDG_DATA_HOME=/opt/godot-data \
    GODOT_INSTALL_DIR=/usr/local/bin

COPY godot-pin.env setup-godot.sh /opt/godot-setup/
# The export runs as the server user, and Godot keeps its editor data next to the templates.
RUN /opt/godot-setup/setup-godot.sh && chmod -R a+rX /opt/godot-data && chmod 1777 /opt/godot-data/godot
