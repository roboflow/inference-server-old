/*jshint esversion:8*/

const axios = require("axios");
const bearerToken = require("express-bearer-token");
var parseToken = bearerToken({
	bodyKey: "access_token",
	queryKey: "access_token",
	headerKey: "Bearer",
	reqKey: "key"
});

var parseKey = bearerToken({
	bodyKey: "api_key",
	queryKey: "api_key",
	headerKey: "Bearer",
	reqKey: "key"
});

var keys = {};

const fs = require("fs");
const crypto = require("crypto");
if(fs.existsSync('/cache/keys.json')) keys = JSON.parse(fs.readFileSync('/cache/keys.json'));

module.exports = function(req, res, next) {
    if(req.query.publishable_key) {
        req.publishable_key = req.query.publishable_key;
        return next();
    }

	var parse = parseToken;
	var route = "publishable_key";
	if(req.newFormat) {
		parse = parseKey;
		route = "convert_key";
	}

    parse(req, res, function() {
        if(!req.key) {
    		res.status(401).json({
    			error: {
    				message: "This method requires your API key.",
    				type: "OAuthException",
    				hint: "You may pass a token as `api_key` in the request body or query parameters, or through an `Authorization: Bearer <api_key>` header."
    			}
    		});
    		return;
    	}

		var keyHash = crypto.createHash('md5').update(req.key).digest('hex');

        if(keys[keyHash]) {
            req.publishable_key = keys[keyHash];
            return next();
        }

		var url = "https://api.roboflow.com/" + route;
		if(process && process.env && process.env.LICENSE_SERVER) {
			url = "http://" + process.env.LICENSE_SERVER + "/proxy?url=" + encodeURIComponent(url);
		}

        axios({
            method: "GET",
            url: url,
            params: {
                api_key: req.key
            }
        }).then(function(response) {
            if(response.data && response.data.publishable_key) {
                req.publishable_key = response.data.publishable_key;
                keys[keyHash] = req.publishable_key;

				try {
					if(fs.existsSync('/cache/')) {
						fs.writeFileSync('/cache/keys.json', JSON.stringify(keys));
					}
				} catch(e) {}

                return next();
            } else {
                res.json(response.data);
            }
        }).catch(function(err) {
			//if no network access just pass through the key, becasue it won't get checked anyway
			req.publishable_key = req.key;
			// keys[keyHash] = req.publishable_key;
			return next();
		});
    });
};
