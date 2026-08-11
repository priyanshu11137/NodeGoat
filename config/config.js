const _ = require("underscore");
const util = require("util");

const ALLOWED_ENVS = ["development", "test", "production"];
const rawEnv = process.env.NODE_ENV || "development";
const finalEnv = ALLOWED_ENVS.includes(rawEnv.toLowerCase()) ? rawEnv.toLowerCase() : "development";

const allConf = require("./env/all");
const envConfigs = {
  development: require("./env/development"),
  test: require("./env/test"),
  production: require("./env/production"),
};
const envConf = envConfigs[finalEnv] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
