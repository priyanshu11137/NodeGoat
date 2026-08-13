const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require("./env/all.js");

let envConf;
switch (finalEnv.toLowerCase()) {
    case "production": envConf = require("./env/production.js"); break;
    case "test": envConf = require("./env/test.js"); break;
    default: envConf = require("./env/development.js"); break;
}

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
