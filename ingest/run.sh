#!/bin/bash

set -e

paths=(~/projects/neugierig/logs/access_log.202* ~/projects/neugierig/logs/access_log)
for path in "${paths[@]}"; do
    echo $path >&2
    if [[ $path == *.bz2 ]]; then
        bzcat $path
    else
        cat $path
    fi
done | go run .
