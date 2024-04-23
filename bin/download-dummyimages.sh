#!/bin/bash

cd "${0%/*}" && \
cd .. && \
./bin/install.sh && \
docker compose run --rm \
pattern-lab bash -c 'yarn run download_dummyimages'
