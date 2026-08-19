const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require(path.resolve(__dirname + "/../config/env/all.js")); // demo/placeholder values only
const envConf = require(path.resolve(__dirname + "/../config/env/" + finalEnv.toLowerCase() + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
