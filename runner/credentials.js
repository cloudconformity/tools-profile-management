module.exports = (() => {
	const fs = require("fs");
	const stat = fs.statSync("./credentials.local.js");
	let credentials = {
		apiEndpoint: process.env.CC_API_ENDPOINT,
		apiKey: process.env.CC_API_KEY
	};
	if (stat.isFile()) {
		// Optional file
		// eslint-disable-next-line node/no-missing-require
		credentials = require("./credentials.local.js");
	}
	return credentials;
})();
