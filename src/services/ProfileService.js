"use strict";
const logger = require("../utils/logger");
const ConformityService = require("./ConformityService");
const Bluebird = require("bluebird");
const profileLoadConcurrency = Number(process.env.CC_PROFILE_LOAD_CONCURRENCY) || 5;
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
		if (profile.data.id) {
			logger.debug("Updating Profile");
			return this.request({
				path: `/v1/profiles/${profile.data.id}`,
				method: "PATCH",
				data: profile
			});
		} else {
			logger.debug("Saving new Profile");
			return this.request({
				path: "/v1/profiles",
				method: "POST",
				data: profile
			});
		}
	}

	async apply({ profileId, accountIds, notes }) {
		logger.info("Applying Profile [id=%s] to %d Accounts", profileId, accountIds.length);
		const data = {
			meta: {
				accountIds,
				types: ["rule"],
				mode: profileApplyMode,
				notes
			}
		};
		return this.request({
			path: `/v1/profiles/${profileId}/apply`,
			method: "POST",
			data
		});
	}

	async applyBulk({ profileIds, accountIds, masterProfileId, notes }) {
		logger.info("Applying %d Profiles to %d Accounts", profileIds.length, accountIds.length);
		const profiles = await this.loadBulk(profileIds);
		const masterProfile = ProfileService.merge(profiles);
		masterProfile.data.id = masterProfileId;
		logger.info("Saving Master Profile");
		const savedMasterProfile = await this.save(masterProfile);
		return this.apply({ profileId: savedMasterProfile.data.id, accountIds, notes });
	}

	static merge(profiles) {
		logger.info("Merging Profiles");
		const mergedProfile = {
			data: {
				type: "profiles",
				attributes: {
					name: "Master Profile - " + new Date().toLocaleString(),
					description: "Created from mixing " + profiles.length + " Profiles"
				},
				relationships: { ruleSettings: { data: [] } }
			}
		};
		const allRuleSettings = profiles
			.reduce((allSettings, profile) => allSettings.concat(profile.included), [])
			.filter(setting => setting.type === "rules");
		const mergedRuleSettingsMap = allRuleSettings.reduce((ruleSettingsMap, ruleSetting) => {
			ruleSettingsMap.set(ruleSetting.id, ruleSetting);
			return ruleSettingsMap;
		}, new Map());
		const mergedRuleSettings = Array.from(mergedRuleSettingsMap.values());
		logger.info(
			"Merged %d Profiles including %d Rule Settings to a Master Profile including %d Rule Settings",
			profiles.length,
			allRuleSettings.length,
			mergedRuleSettings.length
		);
		const sanitisedRuleSettings = mergedRuleSettings.map(ruleSetting => {
			const copy = JSON.parse(JSON.stringify(ruleSetting));
			if (!copy.attributes.enabled) {
				delete copy.attributes.extraSettings;
			}
			return copy;
		});
		mergedProfile.included = sanitisedRuleSettings;

		mergedProfile.data.relationships.ruleSettings.data = sanitisedRuleSettings.map(
			ruleSetting => ({
				id: ruleSetting.id,
				type: ruleSetting.type
			})
		);

		return mergedProfile;
	}
}
module.exports = ProfileService;
