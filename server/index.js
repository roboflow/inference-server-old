/*jshint esversion:8*/

const express = require("express");

const roboflow_package = process.env.ROBOFLOW_PACKAGE || "roboflow-node";
//const roboflow_package = "/Users/wolf/roboflow/roboflow-infer-web/node/dist/0.2.6/roboflow.js";
const roboflow = require(roboflow_package);

const app = express();
const port = 9001;

const cookieParser = require("cookie-parser")();
const bodyParser = require("body-parser");
const cors = require("cors")({
	origin: true,
	methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "PURGE", "DELETE"]
});

const async = require("async");
const _ = require("lodash");
const fs = require("fs");

const package_info = JSON.parse(fs.readFileSync(__dirname + "/package.json"));

var staging = true;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true,
    limit: "100mb",
    verify: function(req, res, buf) {
        req.rawBody = buf;
    }
}));
app.use(bodyParser.text());
app.use(cookieParser);

app.set("json spaces", 4);

const SERVER_START = Date.now();

app.get("/", function(req, res) {
    res.json({
        server: {
            package: package_info.name,
            version: package_info.version
        },
        roboflow: {
            package: roboflow_package,
            version: roboflow.VERSION
        }
    });
});

var models = {};
var loading = {};

var infer = function(req, res) {
	if(req.query.format && req.query.format == "image") {
		return res.json({
			error: "The inference server does not yet support returning a visualization of the prediction."
		});
	}

	var start = Date.now();

    var buffer = Buffer.from(req.body, "base64");
    var arr = new Uint8Array(buffer);

	var tensor;
	try {
		// works for decoding 3 channel (rgb) and 4 channel (rgba) images
    	tensor = roboflow.tf.node.decodeImage(arr, 3);
	} catch(e) {
		// handle 1 channel (grayscale) images
		// which throw an error if you try to force them to be decoded with 3 channels
		var channel = roboflow.tf.node.decodeImage(arr, 1);
		tensor = roboflow.tf.stack([
			channel,
			channel,
			channel
		], 2).squeeze();
		roboflow.tf.dispose(channel);
	}

	var configuration = {
		max_objects: Number.MAX_SAFE_INTEGER,
		overlap: 0.3,
		nms_threshold: 0.3,
		threshold: 0.4
	};

	if(req.query.overlap) {
		req.query.overlap = parseFloat(req.query.overlap);
		if(req.query.overlap > 1) req.query.overlap /= 100;
		configuration.overlap = req.query.overlap;
		configuration.nms_threshold = req.query.overlap;
	}

	if(req.query.confidence) {
		req.query.confidence = parseFloat(req.query.confidence);
		if(req.query.confidence > 1) req.query.confidence /= 100;
		configuration.threshold = req.query.confidence;
	}

	var allowed_classes = null; // allow all
	if(req.query.classes) {
		allowed_classes = _.map(req.query.classes.split(","), function(cls) {
			return cls.trim();
		});
	}

	req.model.configure(configuration);

    req.model.detect(tensor).then(function(predictions) {
		req.model.inferences = (req.model.inferences||0)+1;
		req.model.totalTime = (req.model.totalTime||0)+(Date.now()-start);

		var ret = {
            predictions: _.chain(predictions).map(function(p) {
				if(allowed_classes && !allowed_classes.includes(p.class)) return null;

                return {
                    x: Math.round(p.bbox.x * 10)/10,
                    y: Math.round(p.bbox.y * 10)/10,
                    width: Math.round(p.bbox.width),
                    height: Math.round(p.bbox.height),
                    class: p.class,
                    confidence: Math.round(p.confidence * 1000) / 1000
                };
            }).filter().value()
        };

		var conf = req.model.getConfiguration();
		if(conf.expiration) ret.expiration = conf.expiration;

        res.json(ret);
    }).catch(function(e) {
        res.json({
            error: e
        });
    }).finally(function() {
        roboflow.tf.dispose(tensor);
    });
};

var loadAndInfer = function(req, res) {
    var modelId = [req.dataset, req.version].join("/");
    if(models[modelId]) {
        // model is already loaded
        req.model = models[modelId];
        infer(req, res);
    } else if(loading[modelId]) {
        // model is already loading... wait for it to finish
        loading[modelId].push({
            req: req,
            res: res
        });
    } else {
        // need to load the model still
        loading[modelId] = [{
            req: req,
            res: res
        }];

		console.log("Downloading weights for " + req.dataset + "/" + req.version);
		var start = Date.now();
        roboflow.auth({
            publishable_key: req.publishable_key
        }).load({
            model: req.dataset,
            version: req.version,
            onMetadata: function(metadata) {
                console.log("Weights downloaded in", ((Date.now() - start)/1000).toFixed(2), "seconds");
				start = Date.now();
				console.log("Initializing model...");
            }
        }).then(function(model) {
			console.log("Model prepared in", ((Date.now() - start)/1000).toFixed(2), "seconds");

            models[modelId] = model;

            _.each(loading[modelId], function(info) {
                var req = info.req;
                var res = info.res;

                req.model = model;
                _.defer(function() {
                    infer(req, res);
                });
            });

            delete loading[modelId];
        }).catch(function(e) {
            _.each(loading[modelId], function(info) {
                res.json({
                    error: e
                });
            });

            delete loading[modelId];
        });
    }
};

var transformImageBody = function(req, res, next) {
    if(req.rawBody) req.body = req.rawBody.toString();
    if(req.body) {
    	req.body = req.body.replace(/^data:image\/\w+;base64,/, "");
    	req.body = req.body.replace(/ /g, '+');
    }

	if(!req.body || !req.body.length || req.body.length < 4) {
		res.status(401).json({
			error: {
				message: "Image parameter not found.",
				type: "InvalidParameterException",
				hint: "Pass a base64 encoded image as the request body or a (url-encoded) image url in the query string as `image`."
			}
		});
		return;
	}

    next();
};

app.post(
    "/:model",
    transformImageBody,
    require(__dirname + "/convertAccessToken.js"),
    function(req, res) {
        var modelRaw = req.params.model;
        if(!modelRaw.match(/[a-zA-Z0-9]+\-.+\-\-[0-9]+/)) {
            return res.json({
                error: "Invalid model ID; should be of format xx-dataset-name--#"
            });
        }

        var modelParts = modelRaw.split("--");
        var version = modelParts.pop();
        var teamDataset = modelParts.join("--");
        var datasetParts = teamDataset.split("-");
        var team = datasetParts.shift();
        var dataset = datasetParts.join("-");

        req.dataset = dataset;
        req.version = version;

        loadAndInfer(req, res);
    }
);

app.post(
    "/:dataset/:version",
    transformImageBody,
	function(req, res, next) {
		req.newFormat = true;
        req.staging = staging;
		next();
	},
    require(__dirname + "/convertAccessToken.js"),
    function(req, res) {
        req.dataset = req.params.dataset;
        req.version = req.params.version;

        loadAndInfer(req, res);
    }
);

app.get(
	"/cache/:dataset/:version/:file",
	function(req, res) {
		res.sendFile("/cache/" + req.params.dataset + '/' + req.params.version + '/' + req.params.file);
	}
);

app.get("/health", function(req, res) {
	res.status(200).json({
		status: "up"
	});
});

app.get("/stats", function(req, res) {
	res.status(200).json({
		server: {
            package: package_info.name,
            version: package_info.version
        },
        roboflow: {
            package: roboflow_package,
            version: roboflow.VERSION
        },
		uptime: (Date.now() - SERVER_START)/1000,
		models: {
			loading: _.keys(loading),
			ready: _.keys(models)
		},
		stats: _.mapValues(models, function(m) {
			return {
				inferences: (m.inferences || 0),
				latency: m.inferences ? m.totalTime/m.inferences/1000 : 0,
				fps: m.inferences ? m.inferences/(m.totalTime/1000) : 0
			};
		})
	});
});

app.listen(port);

_.defer(function() {
	console.log("inference-server is ready to receive traffic.");
});
