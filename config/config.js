const path = require("path");
const util = require("util");

const VALID_ENVS = ["development", "production", "test"];
const finalEnv = process.env.NODE_ENV || "development";
const normalizedEnv = VALID_ENVS.includes(finalEnv.toLowerCase()) ? finalEnv.toLowerCase() : "development";

const allConf = require(path.join(__dirname, "env", "all.js"));
const envConf = require(path.join(__dirname, "env", normalizedEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
