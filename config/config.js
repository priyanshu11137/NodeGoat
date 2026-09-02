const util = require("util");

const allConf = require("./env/all.js");

// Static allowlist of the supported environments. Every config module is
// required from a literal path, so an attacker-controlled NODE_ENV can never
// make this file load and evaluate arbitrary code from the filesystem.
const envConfs = {
    development: require("./env/development.js"),
    production: require("./env/production.js"),
    test: require("./env/test.js")
};

const finalEnv = (process.env.NODE_ENV || "development").toLowerCase();

const envConf = Object.prototype.hasOwnProperty.call(envConfs, finalEnv) ? envConfs[finalEnv] : {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
