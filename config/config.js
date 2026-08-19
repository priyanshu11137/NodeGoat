const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const ALLOWED_ENVS = ["development", "production", "test"];
const safeEnv = ALLOWED_ENVS.includes(finalEnv.toLowerCase()) ? finalEnv.toLowerCase() : "development";

const allConf = require(path.join(__dirname, "..", "config", "env", "all.js"));
const envConf = require(path.join(__dirname, "..", "config", "env", safeEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
