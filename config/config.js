const _ = require("underscore");
const util = require("util");

const ENV_CONFIGS = {
  development: require("./env/development"),
  production: require("./env/production"),
  test: require("./env/test"),
};

const nodeEnv = process.env.NODE_ENV || "development";
const finalEnv = nodeEnv.toLowerCase();

if (!Object.prototype.hasOwnProperty.call(ENV_CONFIGS, finalEnv)) {
  throw new Error(
    "Unknown NODE_ENV value '" + nodeEnv + "'. Must be one of: " + Object.keys(ENV_CONFIGS).join(", ")
  );
}

const allConf = require("./env/all");
const envConf = ENV_CONFIGS[finalEnv] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
