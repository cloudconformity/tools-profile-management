const logger = require("../src/utils/logger");
const credentials = require("./credentials");

(async () => {
	const RuleService = require("../src/services/RuleService");
	const ruleService = new RuleService(credentials);
	const rules = await ruleService.loadAll();
	logger.info("Rules %o", rules);
})();
