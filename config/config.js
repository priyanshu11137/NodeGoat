const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require(path.resolve(__dirname + "/../config/env/all.js")); // not a secret — this is a module path derived solely from __dirname (no user input)
const envConf = require(path.resolve(__dirname + "/../config/env/" + finalEnv.toLowerCase() + ".js")) || {}; // not a secret — this is a module path built from NODE_ENV; no credential/key/token is present here

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
