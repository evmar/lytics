#!/bin/bash

for f in ../tab/*; do
    size=$(bzip2 -c $f | wc -c)
    echo "$f $size"
done
