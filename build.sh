#!/bin/bash

echo "🛠 : Building roboflow/inference-server:cpu"
docker buildx build --platform linux/amd64 -t "roboflow/inference-server:cpu" -f- . < Dockerfile.cpu

echo ""
echo "🛠 : Building roboflow/inference-server:gpu"
docker buildx build --platform linux/amd64 -t "roboflow/inference-server:gpu" -f- . < Dockerfile.gpu

echo ""
echo "🛠 : Building roboflow/inference-server:jetson"
docker buildx build --platform linux/arm64 -t "roboflow/inference-server:jetson" -f- . < Dockerfile.jetson
