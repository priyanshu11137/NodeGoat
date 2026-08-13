const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const envConfigs = {
    "development": require("./env/development.js"),
    "production": require("./env/production.js"),
    "test": require("./env/test.js")
};

const allConf = require("./env/all.js");
const envConf = envConfigs[finalEnv.toLowerCase()] || envConfigs["development"];

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
