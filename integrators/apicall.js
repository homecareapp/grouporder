var http = require('http');
var https = require('https');
var urlParser = require('url');
var async = require('async');

exports.GET = function(url, cb) {
    async.waterfall([
        function(nextfunc) {
            var httpProtocol = http;
            if (urlParser.parse(url).protocol == 'https:')
                httpProtocol = https;
            httpProtocol.get(url, function(res) {
                    var body = '';
                    res.on('data', function(chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        return nextfunc(null, body);
                    });
                })
                .on('error', function(e) {
                    console.error("Got error: " + e.message);
                    return nextfunc(e);
                });
        }
    ], function(err, result) {
        return cb(err, result)
    })
}

exports.POST = function(url, data, cb) {
    console.log("making api call here");
    async.waterfall([
        function(nextfunc) {
            var httpProtocol = http;
            if (urlParser.parse(url).protocol == 'https:')
                httpProtocol = https;

            var dataString = JSON.stringify(data);
            var options = {
                host: urlParser.parse(url).host,
                path: urlParser.parse(url).path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': dataString.length
                }
            }
            var req = httpProtocol.request(options, function(res) {
                res.setEncoding('utf-8');
                var responseString = '';
                res.on('data', function(data) {
                    responseString += data;
                });
                res.on('end', function() {
                    return nextfunc(null, responseString);
                });
            });
            req.on('error', function(e) {
                return nextfunc(e);
            });
            req.write(dataString);
            req.end();
        }
    ], function(err, result) {
        console.log("end apicall waterfall function");
        return cb(err, result)
    })
}
