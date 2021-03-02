/*jshint esversion:8*/

const express = require("express");

const roboflow_package = process.env.ROBOFLOW_PACKAGE || "roboflow-node";
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true,
    limit: "100mb"
}));
app.use(bodyParser.text());
app.use(cookieParser);

app.set("json spaces", 4);

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

var infer = function(req, res) {
    res.json({
        publishable_key: req.publishable_key,
        dataset: req.dataset,
        version: req.version
    });
};

app.post(
    "/:model",
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

        infer(req, res);
    }
);

app.post(
    "/:dataset/:version",
    require(__dirname + "/convertAccessToken.js"),
    function(req, res) {
        req.dataset = req.params.dataset;
        req.version = req.params.version;

        infer(req, res);
    }
);

app.listen(port);
