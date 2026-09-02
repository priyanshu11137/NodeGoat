const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

// Use a static map of literal require() calls instead of building the
// module path from user/environment-controlled input, to avoid eval /
// non-literal require injection (CWE-95).
const allConf = require("./env/all.js");
const envConfMap = {
    development: require("./env/development.js"),
    production: require("./env/production.js"),
    test: require("./env/test.js")
};
const envConf = envConfMap[finalEnv.toLowerCase()] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
