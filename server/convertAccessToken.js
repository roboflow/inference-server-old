/*jshint esversion:8*/

const axios = require("axios");
const bearerToken = require("express-bearer-token");
var parseToken = bearerToken({
	bodyKey: "access_token",
	queryKey: "access_token",
	headerKey: "Bearer",
	reqKey: "key"
});

var keys = {};

module.exports = function(req, res, next) {
    if(req.query.publishable_key) {
        req.publishable_key = req.query.publishable_key;
        return next();
    }

    parseToken(req, res, function() {
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

        if(keys[req.key]) {
            req.publishable_key = keys[req.key];
            return next();
        }

        axios({
            method: "GET",
            url: "https://api.roboflow.com/publishable_key",
            params: {
                api_key: req.key
            }
        }).then(function(response) {
            if(response.data && response.data.publishable_key) {
                req.publishable_key = response.data.publishable_key;
                keys[req.key] = req.publishable_key;
                return next();
            } else {
                res.json(response.data);
            }
        });
    });
};
