#!/bin/bash

for f in ../tab/*; do
    size=$(gzip -c $f | wc -c)
    echo "$f $size"
done
