#!/bin/sh
set -eu

# Railway mounts the persistent volume as root. Give the unprivileged node
# user ownership before dropping privileges so the donation ledger and alert
# queue remain writable across deploys.
mkdir -p /app/data
chown -R node:node /app/data

exec su-exec node "$@"
