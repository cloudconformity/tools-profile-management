process.env.DEBUG = "true";
const logger = require("../src/utils/logger");
const credentials = require("./credentials");

(async () => {
	try {
		const ProfileService = require("../src/services/ProfileService");
		const profileService = new ProfileService(credentials);
		const profile = require("./profile");
		// profile.data.id = "...";
		const savedProfile = await profileService.save(profile);
		logger.info("Saved Profile: %o", savedProfile);
	} catch (error) {
		logger.error("Error occurred while saving Profile %o", JSON.stringify(error, null, 2));
		if (error.response) {
			logger.error("Error response body: %s", JSON.stringify(error.response.body, null, 2));
		}
	}
})();
