const _ = require("underscore");
const util = require("util");

// Whitelist allowed environments to prevent path traversal/injection via NODE_ENV
const ALLOWED_ENVS = ["development", "test", "production"];
const rawEnv = process.env.NODE_ENV || "development";
const finalEnv = ALLOWED_ENVS.includes(rawEnv.toLowerCase()) ? rawEnv.toLowerCase() : "development";

const allConf = require("./env/all.js");
const ENV_MODULES = {
    development: require("./env/development.js"),
    test: require("./env/test.js"),
    production: require("./env/production.js")
};
const envConf = ENV_MODULES[finalEnv] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
