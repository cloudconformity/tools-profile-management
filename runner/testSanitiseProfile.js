process.env.DEBUG = "true";
const logger = require("../src/utils/logger");
const credentials = require("./credentials");

(async () => {
	const ProfileService = require("../src/services/ProfileService");
	const profileService = new ProfileService(credentials);
	const profileRequest = require("./profile");
	const sanitisedRequest = await profileService.sanitise(profileRequest);
	logger.info("Sanitised Profile\n %s", JSON.stringify(sanitisedRequest, null, 2));
})();
