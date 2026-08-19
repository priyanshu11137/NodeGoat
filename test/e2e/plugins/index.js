// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

const fs = require("fs");
const path = require("path");
const { port, hostName } = require("../../../config/env/all");

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
// `on` is used to hook into various events Cypress emits
// `config` is the resolved Cypress config
module.exports = (on, config) => {
  "use strict";

  const tlsKeyPath = path.resolve(__dirname, "../../../artifacts/cert/server.key");
  const tlsCertPath = path.resolve(__dirname, "../../../artifacts/cert/server.crt");
  const certReady = fs.existsSync(tlsKeyPath) && fs.existsSync(tlsCertPath);
  const protocol = certReady ? "https" : "http";
  config.baseUrl = `${protocol}://${hostName}:${port}`;

  return config;
};
