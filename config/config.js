const _ = require("underscore");
const util = require("util");

// Whitelist allowed environments to prevent path traversal/injection via NODE_ENV
const ALLOWED_ENVS = ["development", "test", "production"];
const rawEnv = process.env.NODE_ENV || "development";
const finalEnv = ALLOWED_ENVS.includes(rawEnv.toLowerCase()) ? rawEnv.toLowerCase() : "development";

// Use static require literals for each known environment to avoid dynamic require injection
const allConf = require("../config/env/all.js");
const ENV_CONFIGS = {
    development: require("../config/env/development.js"),
    test: require("../config/env/test.js"),
    production: require("../config/env/production.js"),
};
const envConf = ENV_CONFIGS[finalEnv] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
