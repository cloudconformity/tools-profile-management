#!/usr/bin/env node
"use strict";

const { Command } = require("commander");
const { version } = require("../package.json");

(async () => {
	const program = new Command();
	program
		.version(version)
		.requiredOption("-k, --api-key <API Key>", "Conformity API key")
		.option("-d, --debug", "Enable debug logging")
		.option(
			"-r, --region <us-west-2|ap-southeast-2|eu-west-1>",
			"Conformity service region",
			"us-west-2"
		)
		.option(
			"-e, --api-endpoint <Endpoint URL>",
			"Optional Conformity API endpoint (overrides region) e.g. https://us-west-2-api.cloudconformity.com"
		)
		.requiredOption(
			"-p, --profiles <Profile IDs>",
			"Comma-separated Profile IDs to be applied to accounts",
			list => list.split(",")
		)
		.requiredOption(
			"-a, --accounts <Account IDs>",
			"Comma-separated Target Account IDs",
			list => list.split(",")
		)
		.requiredOption("-n, --notes <Profile Apply Notes>", "Notes to use when applying Profiles")
		.option("-m, --master-profile-id <Master Profile ID>", "Optional Master Profile ID")
		.parse();

	const {
		profiles: profileIds,
		accounts: accountIds,
		region,
		apiKey,
		debug,
		masterProfileId,
		notes
	} = program;
	const apiEndpoint = program.apiEndpoint || `https://${region}-api.cloudconformity.com`;
	if (debug) {
		// Enable debug logging
		process.env.DEBUG = true;
	}
	const logger = require("./utils/logger");
	try {
		const ProfileService = require("./services/ProfileService");
		const profileService = new ProfileService({
			apiKey,
			apiEndpoint
		});
		await profileService.applyBulk({ profileIds, accountIds, masterProfileId, notes });
		logger.info("Profiles were applied successfully", profileIds.length, accountIds.length);
	} catch (error) {
		logger.error(
			"Error [%s] occurred while applying Profiles to Accounts",
			error.code || error.message
		);
		logger.debug("Error details: %s", JSON.stringify(error, null, 2));
		if (error.response) {
			logger.error("Error response body: %s", JSON.stringify(error.response.body, null, 2));
		}
		// eslint-disable-next-line no-process-exit
		process.exit(1);
	}
})();
