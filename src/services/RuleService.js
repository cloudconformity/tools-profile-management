"use strict";
const logger = require("../utils/logger");
const ConformityService = require("./ConformityService");
const { Deserializer } = require("jsonapi-serializer");

class RuleService extends ConformityService {
	constructor({ apiKey, apiEndpoint }) {
		super({ apiKey, apiEndpoint });
		this.deserializer = new Deserializer({ keyForAttribute: "camelCase" });
	}
	async loadServices() {
		logger.debug("Loading Services");
		const response = await this.request({
			path: "/v1/services"
		});
		const sanitisedServicesResponse = RuleService.sanitiseServicesResponse(response);
		return this.deserializer.deserialize(sanitisedServicesResponse);
	}
	async loadAll() {
		logger.debug("Loading Rules");
		const services = await this.loadServices();
		return RuleService.extractRulesFromServices(services);
	}
	static extractRulesFromServices(services) {
		return services.reduce((rules, service) => {
			const serviceRules = service.rules.map(rule => {
				const ruleCopy = JSON.parse(JSON.stringify(rule));
				ruleCopy.service = service.id;
				return ruleCopy;
			});
			return rules.concat(serviceRules);
		}, []);
	}
	static sanitiseServicesResponse(response) {
		const sanitisedResponse = JSON.parse(JSON.stringify(response));
		sanitisedResponse.included = sanitisedResponse.included.map(item => {
			return {
				type: "rules",
				id: item.id,
				attributes: item
			};
		});
		return sanitisedResponse;
	}
}
module.exports = RuleService;
