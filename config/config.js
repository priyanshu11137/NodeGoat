const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require(path.resolve(__dirname + "/../config/env/all.js")); // demo/placeholder values only
// Load env configs statically to prevent dynamic path injection (CWE-95).
const envConfigs = {
    development: require("./env/development.js"),
    test: require("./env/test.js"),
    production: require("./env/production.js"),
};
const lowerEnv = finalEnv.toLowerCase();
const safeKey = Object.prototype.hasOwnProperty.call(envConfigs, lowerEnv) ? lowerEnv : "development";
const envConf = envConfigs[safeKey];

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
