#!/bin/bash

cd "${0%/*}" && \
cd .. && \
./bin/install.sh && \
docker compose up
