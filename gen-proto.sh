#!/bin/sh

set -e

# TODO: generates into a random subdir
protoc --go_out=. lytics.proto
mv github.com/evmar/lytics/pb/lytics.pb.go pb
rm -rf github.com
