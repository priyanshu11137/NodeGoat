const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allowedEnvs = ["development", "production", "test"];
const sanitizedEnv = allowedEnvs.includes(finalEnv.toLowerCase()) ? finalEnv.toLowerCase() : "development";

const allConf = require("./env/all.js");
const envConf = require("./env/" + sanitizedEnv + ".js") || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
