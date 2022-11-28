#!/bin/bash

set -e

paths=(~/projects/neugierig/logs/access_log.{2019,2020,2021,2022}* ~/projects/neugierig/logs/access_log)
for path in "${paths[@]}"; do
    echo $path >&2
    if [[ $path == *.bz2 ]]; then
        bzcat $path
    else
        cat $path
    fi
done | go run . ../tab
