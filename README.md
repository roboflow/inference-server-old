# ⚠️ DEPRECATION WARNING

The code in this repo is deprecated. It contains the code for the old Node.js based Roboflow Inference server powered by
[roboflow.js](https://docs.roboflow.com/deploy/web-browser) and TFjs-node.

The [new Roboflow Inference Server](https://github.com/roboflow/inference) is
open-source, faster, supports more models, works on more devices,
has more features, is under active development, and is better in every way.

You should [use that](https://github.com/roboflow/inference) instead.

<details close>
<summary>Old Readme Content</summary>
# Roboflow Edge Inference Server

The Roboflow Edge Inference Server is an on-device implementation of our
[hosted object detection inference API](https://docs.roboflow.com/inference/hosted-api).
It lets you run your custom-trained [Roboflow Train](https://docs.roboflow.com/train)
models on-device which means you can run them in situations where bandwidth is limited
or production images cannot be processed by a third party.

[📚 Full Documentation](https://docs.roboflow.com/inference/nvidia-jetson)

## How it Works

You `pull` and `run`
[our `roboflow/inference-server` Docker container](https://hub.docker.com/repository/docker/roboflow/inference-server)
and the Inference Server will become available on port `9001`.

Your model is downloaded the first time you invoke it and inference is done on
your device (with hardware acceleration where applicable) via an HTTP interface;
your images and model predictions never leave the device.

## Supported Devices

We have currently launched support for
[the NVIDIA Jetson line of devices](https://developer.nvidia.com/embedded/jetson-developer-kits)
(including the Jetson Nano 2GB, Jetson Nano 4GB, and Jetson Xavier NX).
We recommend running the latest version of
[NVIDIA JetPack (4.5.1)](https://developer.nvidia.com/embedded/jetpack).

Support for CPU inference and arbitrary CUDA GPUs is a work in progress and
will be officially supported soon. [Reach out](https://roboflow.com/sales) if
you would like early access.

## When to Use

For most use-cases, the
[Hosted Inference API](https://docs.roboflow.com/inference/hosted-api) is preferable.
It requires no setup or maintenance and automatically handles autoscaling up
and down to handle any amount of load (even Hacker News and Reddit front page
traffic are no match for it) and in almost all cases has a lower total cost.

There are two primary use-cases where our Hosted API is needed:

* When bandwidth is constrained or an Internet connection is unreliable (eg for autonomous vehicles).
* When production images cannot be processed by a third party (eg for privacy or security reasons).

## Requirements

You will need:

* A custom model trained with [Roboflow Train](https://docs.roboflow.com/train),
* A [Roboflow Pro](https://roboflow.com/pro) account,
* A supported device with a network connection (~8MB of data will be used to download your model weights).

## Limitations

Currently, the server downloads weights over the network each time it starts up;
this means it cannot yet be used in fully-offline situations. We are working on
supporting offline and air-gapped mode soon. [Reach out](https://roboflow.com/sales) if
you would like early access.

## Installation

Pull down [the `inference-server` Docker container](https://hub.docker.com/r/roboflow/inference-server)
built for your device; for NVIDIA Jetsons, this is:
```
sudo docker pull roboflow/inference-server:jetson
```

Then run the Docker container with your GPU and network interface:
```
sudo docker run --net=host --gpus all roboflow/inference-server:jetson
```

## Usage

After `docker run` is invoked, the server will be running on port `9001`. You
can get predictions from it using the same code as
[with our Hosted API](https://docs.roboflow.com/inference/hosted-api)
(replacing references to `infer.roboflow.com` with `localhost:9001` or your
Jetson's local IP address).

```
base64 YOUR_IMAGE.jpg | curl -d @- \
"http://localhost:9001/xx-your-model--1?access_token=YOUR_KEY"
```

## More Info

To read more about the Roboflow Inference Server, performance expectations,
and speed optimization tips,
[read the full documentation](https://docs.roboflow.com/inference/nvidia-jetson).
And for code snippets in your preferred language, see
[the Roboflow Infer API documentation](https://docs.roboflow.com/inference/hosted-api).

## About Roboflow

[Roboflow](https://roboflow.com) is the easiest way to turn your images into
actionable information. We provide all the tools you need to get started building
computer vision into your applications all the way from annotation to deployment.

[Get started](https://app.roboflow.com) with a free account and you'll have
a working model tailored to your specific use-case in an afternoon.
</details>