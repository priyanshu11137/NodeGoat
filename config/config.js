const _ = require("underscore");
const util = require("util");

const ALLOWED_ENVS = ["development", "production", "test"];

const requestedEnv = (process.env.NODE_ENV || "development").toLowerCase();
const finalEnv = ALLOWED_ENVS.includes(requestedEnv) ? requestedEnv : "development";

const allConf = require("./env/all.js");
const envConf = require(`./env/${finalEnv}.js`) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
