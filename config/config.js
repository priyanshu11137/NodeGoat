const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

// Static require — no dynamic path concatenation (CWE-95)
const allConf = require("./env/all.js");

// Allowlist of known environments — prevents arbitrary path injection via NODE_ENV
const envConfigs = {
    "development": require("./env/development.js"),
    "test": require("./env/test.js"),
    "production": require("./env/production.js")
};
const envConf = envConfigs[finalEnv.toLowerCase()] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
