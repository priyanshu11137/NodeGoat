const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require("./env/all.js");

// Environment configs are loaded through this static allowlist instead of
// building a path and passing it to require(). NODE_ENV is externally
// controlled, so a non-literal require there could load arbitrary files.
const envConfs = {
    development: require("./env/development.js"),
    production: require("./env/production.js"),
    test: require("./env/test.js")
};

const envName = finalEnv.toLowerCase();
// Unknown/unsupported environment names fall back to the defaults in all.js.
const envConf = Object.prototype.hasOwnProperty.call(envConfs, envName) ? envConfs[envName] : {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
