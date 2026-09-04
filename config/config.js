const _ = require("underscore");
const util = require("util");

const allConf = require("./env/all.js");

// Per-environment config is picked from a static allowlist of statically
// required modules. The environment name never takes part in building a
// require path, so a controllable NODE_ENV cannot be used to evaluate
// injected code or to load an unintended module.
const ENV_CONFIGS = {
    development: require("./env/development.js"),
    test: require("./env/test.js"),
    production: require("./env/production.js")
};

const finalEnv = (process.env.NODE_ENV || "development").toLowerCase();

if (!Object.prototype.hasOwnProperty.call(ENV_CONFIGS, finalEnv)) {
    throw new Error(`Unsupported NODE_ENV "${finalEnv}": expected one of ${Object.keys(ENV_CONFIGS).join(", ")}`);
}

const envConf = ENV_CONFIGS[finalEnv] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
