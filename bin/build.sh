#!/bin/bash

# this script needs user:group mapping because deploy pipelines
# run with a different users and might need to touch the build files

cd "${0%/*}" && \
cd .. && \
./bin/install.sh && \
ENVIRONMENT='pl' \
docker compose run --rm \
-u "$(id -u):$(id -g)" \
-e ENVIRONMENT \
pattern-lab bash -c 'yarn run build'
