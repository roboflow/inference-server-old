#!/bin/bash

echo "🚀 : Deploying roboflow/inference-server:cpu"
docker push "roboflow/inference-server:cpu"

echo ""
echo "🚀 : Deploying roboflow/inference-server:gpu"
docker push "roboflow/inference-server:gpu"

echo ""
echo "🚀 : Deploying roboflow/inference-server:jetson"
docker push "roboflow/inference-server:jetson"
