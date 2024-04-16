#!/bin/bash

cd "${0%/*}" && \
cd .. && \
./bin/install.sh && \
ENVIRONMENT="prod" \
docker compose run --rm \
-e ENVIRONMENT \
pattern-lab bash -c "yarn run build"
