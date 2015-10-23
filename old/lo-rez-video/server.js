/*
 * Originally from https://gist.github.com/1245922
 *
 * Almost works for my purpose, except for video streaming support...
 * Maybe later.
 */

/*
 * Fork & Refactor of https://gist.github.com/246761
 *  -> Credit: Noah Sloan <http://noahsloan.com>
 */

/**
 * Simple webserver with logging. Serves whatever files are reachable from
 * the directory where node is running. Supports Windows port of node.
 */
var fs = require('fs'),
	path = require('path'),
	sys = require('util');

var DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3;
var LOG_LEVEL = DEBUG;

var PORT = 8080;

require("http").createServer(function(req,resp) {
	// don't allow ../ in paths
	var file = '.' + req.url;
	if (file.substr(-1) === '/') file += 'index.html';
	var ext = path.extname(file);
	var contentType = 'text/html';
	log(ERROR,ext);
	switch(ext) {
		case '.htm':
			contentType = 'text/html';
			break;
		case '.html':
			contentType = 'text/html';
			break;
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
		case '.png':
			contentType = 'image/png';
			break;
		case '.jpeg':
			contentType = 'image/jpeg';
			break;
		case '.jpg':
			contentType = 'image/jpeg';
			break;
		case '.gif':
			contentType = 'image/gif';
			break;
		case '.ico':
			contentType = 'image/gif';
			break;
		case '.webm':
			contentType = 'video/webm';
			break;
		default:
			contentType = 'text/plain';
			break;
	}
	log(DEBUG,"Got request for",file,contentType);
	streamFile(file,resp,contentType);
}).listen(PORT);

log(INFO,"Server running on port",PORT);

function streamFile(file,resp,contentType) {
    path.exists(file, function(exists) {
		if (exists) {
			fs.stat(file, function(err, stats) {
				if (err) {
					resp.writeHead(500);
					resp.end();
					log(WARN, "Error obtaining file information: ", file);
				} else {
					fs.readFile(file, function(err,data) {
						if (err) {
							resp.writeHead(500);
							resp.end();
							log(WARN, "No such file: ", file);
						} else {
							resp.writeHead(200, { 'Content-Type': contentType, 'Content-Length': stats.size });
							resp.end(data, 'utf-8');
						}
					});
				}
			});
		} else {
			resp.writeHead(404);
			resp.end();
		}
	});
}

/* Logging/Utility Functions */
function log(level) {
    if(level >= LOG_LEVEL) sys.puts(join(slice(arguments,1)));
}
function slice(array,start) {
	return Array.prototype.slice.call(array,start);
}
function isString(s) {
	return typeof s === "string" || s instanceof String;
}
function flatten(array) {
	var result = [], i, len = array && array.length;
	if(len && !isString(array)) {
		for(i = 0; i < len; i++) {
			result = result.concat(flatten(array[i]));
		}
	} else if(len !== 0) {
		result.push(array);
	}
	return result;
}
function join() {
	return flatten(slice(arguments,0)).join(" ");
}
