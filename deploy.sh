#!/bin/bash

set -e

cp -r tab demo
(cd web && npm run bundle)
cp web/{index.html,bundle.js} demo

