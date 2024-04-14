#!/bin/bash

cd "${0%/*}" && \
cd .. && \
./bin/install.sh && \
docker compose run --rm pattern-lab bash -c 'yarn run build | yarn run roarr pretty-print'
