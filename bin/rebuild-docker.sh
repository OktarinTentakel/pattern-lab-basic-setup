#!/bin/bash

cd "${0%/*}" && \
cd .. && \
docker compose -f docker-compose.yml build --no-cache
