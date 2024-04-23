#!/bin/bash

cd "${0%/*}" && \
cd .. && \
docker compose run --rm pattern-lab bash -c 'yarn install'
