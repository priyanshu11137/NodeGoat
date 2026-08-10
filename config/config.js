const _ = require("underscore");
const path = require("path");
const util = require("util");

// Allowlist prevents path traversal via NODE_ENV (CWE-95)
const VALID_ENVS = ["development", "test", "production"];
const rawEnv = (process.env.NODE_ENV || "development").toLowerCase();
const finalEnv = VALID_ENVS.includes(rawEnv) ? rawEnv : "development";

const allConf = require("./env/all.js");
const envConf = require(path.join(__dirname, "./env/", finalEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
