const _ = require("underscore");
const util = require("util");

// Whitelist allowed environments to prevent path traversal/injection via NODE_ENV
const ALLOWED_ENVS = ["development", "test", "production"];
const rawEnv = process.env.NODE_ENV || "development";
const finalEnv = ALLOWED_ENVS.includes(rawEnv.toLowerCase()) ? rawEnv.toLowerCase() : "development";

// Static requires — each path is a plain string literal to avoid dynamic require warnings.
const allConf = require("./env/all.js");
let envConf = {};
if (finalEnv === "development") {
  envConf = require("./env/development.js") || {};
} else if (finalEnv === "test") {
  envConf = require("./env/test.js") || {};
} else if (finalEnv === "production") {
  envConf = require("./env/production.js") || {};
}

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
