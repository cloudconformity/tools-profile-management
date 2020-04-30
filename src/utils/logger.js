const { format, transports, createLogger } = require("winston");
const level = process.env.DEBUG ? "debug" : "info";
const logger = createLogger({
	level,
	format: format.combine(format.splat(), format.simple()),
	transports: [
		new transports.Console({
			silent: process.env.NODE_ENV === "test"
		})
	]
});
module.exports = logger;
