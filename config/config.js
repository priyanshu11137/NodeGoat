const _ = require("underscore");
const path = require("path");
const util = require("util");

// Whitelist allowed environments to prevent path traversal/injection via NODE_ENV
const ALLOWED_ENVS = ["development", "test", "production"];
const rawEnv = process.env.NODE_ENV || "development";
const finalEnv = ALLOWED_ENVS.includes(rawEnv.toLowerCase()) ? rawEnv.toLowerCase() : "development";

const allConf = require(path.resolve(__dirname, "../config/env/all.js"));
const envConf = require(path.resolve(__dirname, "../config/env/" + finalEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
