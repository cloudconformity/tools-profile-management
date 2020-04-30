"use strict";
const logger = require("../utils/logger");
const ConformityService = require("./ConformityService");
const Bluebird = require("bluebird");
const profileLoadConcurrency = Number(process.env.CC_PROFILE_LOAD_CONCURRENCY) || 1;
const profileApplyMode = process.env.CC_PROFILE_APPLY_MODE || "overwrite";

class ProfileService extends ConformityService {
	async load(profileId) {
		logger.debug("Loading Profile %s", profileId);
		return this.request({
			path: `/v1/profiles/${profileId}?includes=ruleSettings`
		});
	}

	async loadBulk(profileIds) {
		logger.info("Loading %d Profiles", profileIds.length);
		return Bluebird.resolve(profileIds).map(profileId => this.load(profileId), {
			concurrency: profileLoadConcurrency
		});
	}

	async save(profile) {
		const data = JSON.stringify(profile);
		if (profile.data.id) {
			logger.debug("Updating Profile");
			return this.request({
				path: `/v1/profiles/${profile.data.id}`,
				method: "PATCH",
				data
			});
		} else {
			logger.debug("Saving new Profile");
			return this.request({
				path: "/v1/profiles",
				method: "POST",
				data
			});
		}
	}

	async apply({ profileId, accountIds, notes }) {
		logger.info("Applying Profile [id=%s] to %d Accounts", profileId, accountIds.length);
		const data = JSON.stringify({
			meta: {
				accountIds,
				types: ["rule"],
				mode: profileApplyMode,
				notes
			}
		});
		return this.request({
			path: `/v1/profiles/${profileId}/apply`,
			method: "POST",
			data
		});
	}

	async applyBulk({ profileIds, accountIds, masterProfileId }) {
		logger.info("Applying %d Profiles to %d Accounts", profileIds.length, accountIds.length);
		const profiles = await this.loadBulk(profileIds);
		const notes = ProfileService.getNotes(profiles);
		const masterProfile = ProfileService.merge(profiles);
		masterProfile.data.id = masterProfileId;
		logger.info("Saving Master Profile");
		const savedMasterProfile = await this.save(masterProfile);
		return this.apply({ profileId: savedMasterProfile.data.id, accountIds, notes });
	}

	static merge(profiles) {
		logger.debug("merge Not implemented yet");
		logger.info("Merging Profiles");
		return { data: {} };
	}

	static getNotes(profiles) {
		logger.debug("getNotes Not implemented yet");
		logger.info("Composing notes");
		return "";
	}
}
module.exports = ProfileService;
