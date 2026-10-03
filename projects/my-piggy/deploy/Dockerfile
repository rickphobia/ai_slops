# The web export toolchain: the pinned Godot and its web export templates, nothing else.
# Built by deploy/update-site.sh on the server; the image tag carries the Godot version.
# Debian is pinned to a point release; Godot itself is checked against the pinned checksums.
FROM debian:12.12-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/*

# Install under /opt, open to all users: the build runs as the server user, not root, and
# Godot writes small files next to its templates.
ENV GODOT_INSTALL_DIR=/usr/local/bin \
  XDG_DATA_HOME=/opt/godot-data
COPY scripts/godot-pin.env scripts/setup-godot.sh /tmp/godot-setup/
RUN /tmp/godot-setup/setup-godot.sh && rm -rf /tmp/godot-setup && chmod -R a+rwX /opt/godot-data
