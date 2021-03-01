/*jshint esversion:8*/

const express = require('express');

const roboflow_package = process.env.ROBOFLOW_PACKAGE || 'roboflow-node';
const roboflow = require(roboflow_package);

const app = express();
const port = 9001;

const cookieParser = require('cookie-parser')();
const bodyParser = require('body-parser');
const cors = require('cors')({
	origin: true,
	methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'PURGE', 'DELETE']
});

const async = require('async');
const _ = require('lodash');
const fs = require('fs');

const package_info = JSON.parse(fs.readFileSync(__dirname + "/package.json"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.text());
app.use(cookieParser);

app.set('json spaces', 4);

app.get('/', function(req, res) {
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

app.all('/:model', function(req, res) {
    res.json({
        todo: true
    });
});

app.listen(port);
