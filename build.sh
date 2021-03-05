#!/bin/bash

echo "🛠 : Building roboflow/inference-server:cpu"
docker build -t "roboflow/inference-server:cpu" -f- . < Dockerfile.cpu

echo ""
echo "🛠 : Building roboflow/inference-server:gpu"
docker build -t "roboflow/inference-server:gpu" -f- . < Dockerfile.gpu

echo ""
echo "🛠 : Building roboflow/inference-server:jetson"
docker build -t "roboflow/inference-server:jetson" -f- . < Dockerfile.jetson
