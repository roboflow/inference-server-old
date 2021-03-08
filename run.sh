#!/bin/bash

CUDA=0
JETSON=0

if command -v nccl &> /dev/null; then
    CUDA=1
fi

if test -f "/etc/nv_tegra_release"; then
    JETSON=1
fi

if (($CUDA)); then
    echo "CUDA detected; using GPU version"
    docker run --net=host --gpus all "roboflow/inference-server:gpu"
elif (($JETSON)); then
    echo "Jetson detected; using GPU version"
    sudo docker run --net=host --gpus all "roboflow/inference-server:jetson"
else
    echo "No GPU detected; using CPU version"
    docker run -p 9001:9001 "roboflow/inference-server:cpu"
fi
