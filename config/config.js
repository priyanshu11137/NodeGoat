const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allowedEnvs = ["development", "test", "production"];
const normalizedEnv = finalEnv.toLowerCase();

if (!allowedEnvs.includes(normalizedEnv)) {
  throw new Error("Invalid NODE_ENV value: " + finalEnv + ". Allowed values: " + allowedEnvs.join(", "));
}

const allConf = require("./env/all.js");
const envConfMap = {
  development: () => require("./env/development.js"),
  test: () => require("./env/test.js"),
  production: () => require("./env/production.js")
};
const envConf = envConfMap[normalizedEnv]() || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
