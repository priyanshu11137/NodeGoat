const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

// Static require — no dynamic path concatenation (CWE-95)
const allConf = require("./env/all.js");

// Allowlist lookup using Object.create(null) to prevent prototype injection
const envConfigs = Object.assign(Object.create(null), {
    "development": require("./env/development.js"),
    "test": require("./env/test.js"),
    "production": require("./env/production.js")
});
const envKey = finalEnv.toLowerCase();
const envConf = Object.prototype.hasOwnProperty.call(envConfigs, envKey) ? envConfigs[envKey] : {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
