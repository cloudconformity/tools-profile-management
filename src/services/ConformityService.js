"use strict";
const logger = require("../utils/logger");
const got = require("got");

class ConformityService {
	constructor({ apiKey, apiEndpoint }) {
		this.apiKey = apiKey;
		this.apiEndpoint = apiEndpoint;
	}

	/**
	 * @param path
	 * @param {object} [headers]
	 * @param {object} [data]
	 * @param {string|"GET"|"PUT"|"POST"|"DELETE"|"HEAD"} [method] Request method, defaults to GET
	 * @return {Promise<*>}
	 */
	async request({ path, method, headers, data } = {}) {
		headers = headers || {};
		method = method || "GET";
		headers = {
			"Content-Type": "application/vnd.api+json",
			Authorization: `ApiKey ${this.apiKey}`,
			...headers
		};
		const url = this.apiEndpoint + path;
		logger.debug("Making %s request to %s", method, url);

		const requestOptions = {
			method,
			headers,
			responseType: "json"
		};
		if (data) {
			requestOptions.json = data;
		}
		const { body } = await got(url, requestOptions);
		return body;
	}
}
module.exports = ConformityService;
