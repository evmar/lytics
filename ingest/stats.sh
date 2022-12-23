#!/bin/bash

for f in ../tab/*.js; do
    size=$(wc -c $f | awk '{print $1}')
    gzsize=$(gzip -c $f | wc -c | awk '{print $1}')
    pct=$((gzsize * 100 / size))
    echo "$f $size => $gzsize $pct%"
done
