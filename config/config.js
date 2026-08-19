const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const ALLOWED_ENVS = ["development", "production", "test"];
const safeEnv = ALLOWED_ENVS.includes(finalEnv.toLowerCase()) ? finalEnv.toLowerCase() : "development";

const allConf = require("./env/all.js");
const envConfMap = {
    development: () => require("./env/development.js"),
    production: () => require("./env/production.js"),
    test: () => require("./env/test.js")
};
const envConf = (envConfMap[safeEnv] || envConfMap.development)() || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
