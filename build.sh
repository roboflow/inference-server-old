#!/bin/bash

# needed to build multi-platform images
docker buildx create --name roboflow
docker buildx use roboflow

echo "🛠 : Building roboflow/inference-server:cpu"
docker buildx build --platform linux/amd64,linux/arm64 --output=image -t "roboflow/inference-server:cpu" -f- . < Dockerfile.cpu

echo ""
echo "🛠 : Building roboflow/inference-server:gpu"
docker buildx build --platform linux/amd64 --output=image -t "roboflow/inference-server:gpu" -f- . < Dockerfile.gpu

echo ""
echo "🛠 : Building roboflow/inference-server:jetson"
docker buildx build --platform linux/arm64 --output=image -t "roboflow/inference-server:jetson" -f- . < Dockerfile.jetson
