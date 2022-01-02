/** @format */
const fs = require("fs");
const path = require("path");

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;
var portSSL = 8043;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
	if (!env) {
		return [];
	}
	return env.split(",");
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require("./lib/rate-limit")(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require("./lib/cors-anywhere");

// ssl: {
// 	key: fs.readFileSync(path.join(process.cwd(), "ssl", "private.key")),

// 	cert: fs.readFileSync(path.join(process.cwd(), "ssl", "certificate.crt")),

// 	ca: [fs.readFileSync(path.join(process.cwd(), "ssl", "ca_bundle.crt"))],
// },

cors_proxy
	.createServer({
		originBlacklist: originBlacklist,
		originWhitelist: originWhitelist,
		requireHeader: [],
		checkRateLimit: checkRateLimit,
		removeHeaders: [
			"cookie",
			"cookie2",
			// Strip Heroku-specific headers
			"x-request-start",
			"x-request-id",
			"via",
			"connect-time",
			"total-route-time",
			// Other Heroku added debug headers
			// 'x-forwarded-for',
			// 'x-forwarded-proto',
			// 'x-forwarded-port',
		],
		redirectSameOrigin: true,
		httpProxyOptions: {
			// Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
			xfwd: false,
		},
		httpsOptions: {
			key: fs.readFileSync(path.join(process.cwd(), "ssl", "private.key")),

			cert: fs.readFileSync(path.join(process.cwd(), "ssl", "certificate.crt")),

			ca: [fs.readFileSync(path.join(process.cwd(), "ssl", "ca_bundle.crt"))],
		},
	})
	.listen(port, function () {
		console.log("Running CORS Anywhere on " + port);
	});
