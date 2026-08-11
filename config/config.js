const _ = require("underscore");
const path = require("path");
const util = require("util");

// Whitelist allowed environments to prevent path traversal/injection via NODE_ENV
const ALLOWED_ENVS = ["development", "test", "production"];
const rawEnv = process.env.NODE_ENV || "development";
const finalEnv = ALLOWED_ENVS.includes(rawEnv.toLowerCase()) ? rawEnv.toLowerCase() : "development";

// NOT a secret: this is a static path to a config module, not a credential value.
const allConf = require(path.resolve(__dirname, "../config/env/all.js"));
// NOT a secret: finalEnv is derived from the ALLOWED_ENVS allow-list above, so the
// dynamic segment cannot contain user-supplied arbitrary input. No credential is embedded.
// To eliminate the dynamic require entirely, each allowed environment is enumerated explicitly:
let envConf = {};
if (finalEnv === "development") {
  envConf = require(path.resolve(__dirname, "../config/env/development.js")) || {};
} else if (finalEnv === "test") {
  envConf = require(path.resolve(__dirname, "../config/env/test.js")) || {};
} else if (finalEnv === "production") {
  envConf = require(path.resolve(__dirname, "../config/env/production.js")) || {};
}

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
