"use strict";
const logger = require("../utils/logger");
const ConformityService = require("./ConformityService");
const Bluebird = require("bluebird");
const profileLoadConcurrency = Number(process.env.CC_PROFILE_LOAD_CONCURRENCY) || 5;
const profileApplyMode = process.env.CC_PROFILE_APPLY_MODE || "overwrite";
const RuleService = require("./RuleService");

class ProfileService extends ConformityService {
	constructor({ apiKey, apiEndpoint }) {
		super({ apiKey, apiEndpoint });
		this.ruleService = new RuleService({ apiKey, apiEndpoint });
	}

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

	async sanitise(profile) {
		const sanitisedProfile = JSON.parse(JSON.stringify(profile));
		if (Array.isArray(sanitisedProfile.included)) {
			const rules = await this.ruleService.loadAll();
			sanitisedProfile.included = sanitisedProfile.included.map(item => {
				if (item.type !== "rules") {
					return item;
				}
				const ruleSetting = item;
				if (!ruleSetting.attributes.enabled) {
					delete ruleSetting.attributes.extraSettings;
				}
				if (Array.isArray(ruleSetting.attributes.extraSettings)) {
					ruleSetting.attributes.extraSettings = ruleSetting.attributes.extraSettings.filter(
						extraSetting => {
							if (extraSetting.hidden || extraSetting.readOnly) {
								logger.debug(
									"Removing read-only / hidden extra setting %s from rule %s",
									extraSetting.name,
									ruleSetting.id
								);
								return false;
							}
							if (Array.isArray(extraSetting.values)) {
								const hasEmptyItem = extraSetting.values.some(valueItem => {
									if (!valueItem) {
										return true;
									}
									if (typeof valueItem === "string") {
										return valueItem === "";
									}
									return !valueItem.value;
								});
								if (hasEmptyItem) {
									logger.debug(
										"Removing empty extra setting %s from rule %s",
										extraSetting.name,
										ruleSetting.id
									);
									return false;
								}
							}
							return true;
						}
					);
				}
				const matchingRule = rules.find(rule => rule.id === ruleSetting.id);
				if (matchingRule.multiRiskLevel && ruleSetting.attributes.riskLevel) {
					logger.debug(
						"Removing risk level from multi risk level rule %s",
						matchingRule.id
					);
					delete ruleSetting.attributes.riskLevel;
				}
				return ruleSetting;
			});
		}
		return sanitisedProfile;
	}

	async save(profile) {
		const sanitisedProfile = await this.sanitise(profile);
		if (sanitisedProfile.data.id) {
			logger.debug("Updating Profile");
			return this.request({
				path: `/v1/profiles/${sanitisedProfile.data.id}`,
				method: "PATCH",
				data: sanitisedProfile
			});
		} else {
			logger.debug("Saving new Profile");
			return this.request({
				path: "/v1/profiles",
				method: "POST",
				data: sanitisedProfile
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
		mergedProfile.included = mergedRuleSettings;
		mergedProfile.data.relationships.ruleSettings.data = mergedRuleSettings.map(
			ruleSetting => ({
				id: ruleSetting.id,
				type: ruleSetting.type
			})
		);

		return mergedProfile;
	}
}
module.exports = ProfileService;
