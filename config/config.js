"use strict";

const _ = require("underscore");
const util = require("util");

const ENV_CONFIG_LOADERS = {
    development: () => require("./env/development.js"),
    production: () => require("./env/production.js"),
    test: () => require("./env/test.js")
};

const requestedEnv = (process.env.NODE_ENV || "development").toLowerCase();
const finalEnv = Object.prototype.hasOwnProperty.call(ENV_CONFIG_LOADERS, requestedEnv) ? requestedEnv : "development";

const allConf = require("./env/all.js");
const envConf = ENV_CONFIG_LOADERS[finalEnv]() || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
