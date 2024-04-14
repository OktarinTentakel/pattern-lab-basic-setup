#!/bin/bash

cd "${0%/*}" && \
cd .. && \
docker compose exec pattern-lab bash
