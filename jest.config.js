module.exports = {
	clearMocks: true,
	testPathIgnorePatterns: ["<rootDir>/node_modules", "<rootDir>/integration-test"],
	coveragePathIgnorePatterns: ["<rootDir>/test/mocks"],
	coverageReporters: ["json", "lcov", "json-summary", "text"],
	coverageThreshold: {
		global: {
			statements: 85,
			branches: 85,
			functions: 85,
			lines: 85
		}
	}
};
