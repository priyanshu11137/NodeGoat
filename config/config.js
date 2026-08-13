const util = require("util");

const allConf = require("./env/all.js");

const ENV_CONFIGS = {
    development: require("./env/development.js"),
    production: require("./env/production.js"),
    test: require("./env/test.js")
};

const finalEnv = (process.env.NODE_ENV || "development").toLowerCase();
const envConf = ENV_CONFIGS[finalEnv] || ENV_CONFIGS.development;

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
