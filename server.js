"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
// const csrf = require('csurf');
const consolidate = require("consolidate"); // Templating library adapter for Express
const swig = require("swig");
// const helmet = require("helmet");
const MongoClient = require("mongodb").MongoClient; // Driver for connecting to MongoDB
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const marked = require("marked");
//const nosniff = require('dont-sniff-mimetype');
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret, cookieDomain, cookieName } = require("./config/config"); // Application config properties
// Fix for A6-Sensitive Data Exposure / CWE-319
// Load keys for establishing a secure HTTPS connection.
// Key material is never committed: supply it at runtime through the
// TLS_KEY_PATH / TLS_CERT_PATH environment variables, pointing at a locally
// generated key/cert pair, e.g.
//   openssl req -x509 -newkey rsa:4096 -nodes -days 365 \
//       -keyout "$TLS_KEY_PATH" -out "$TLS_CERT_PATH"
// Both variables set => the app serves HTTPS. Neither set => it falls back to
// plain HTTP, which keeps local development, the e2e suite and deployments that
// terminate TLS at a proxy (docker-compose, Heroku) working unchanged.
const tlsKeyPath = process.env.TLS_KEY_PATH;
const tlsCertPath = process.env.TLS_CERT_PATH;
if (Boolean(tlsKeyPath) !== Boolean(tlsCertPath)) {
    // Half-configured TLS is a misconfiguration: fail closed rather than
    // silently downgrading to cleartext.
    console.log("Error: TLS: set both TLS_KEY_PATH and TLS_CERT_PATH, or neither");
    process.exit(1);
}
const httpsOptions = tlsKeyPath ? {
    key: fs.readFileSync(path.resolve(tlsKeyPath)),
    cert: fs.readFileSync(path.resolve(tlsCertPath)),
    // Do not negotiate legacy protocol versions.
    minVersion: "TLSv1.2"
} : null;

MongoClient.connect(db, (err, db) => {
    if (err) {
        console.log("Error: DB: connect");
        console.log(err);
        process.exit(1);
    }
    console.log(`Connected to the database`);

    /*
    // Fix for A5 - Security MisConfig
    // TODO: Review the rest of helmet options, like "xssFilter"
    // Remove default x-powered-by response header
    app.disable("x-powered-by");

    // Prevent opening page in frame or iframe to protect from clickjacking
    app.use(helmet.frameguard()); //xframe deprecated

    // Prevents browser from caching and storing page
    app.use(helmet.noCache());

    // Allow loading resources only from white-listed domains
    app.use(helmet.contentSecurityPolicy()); //csp deprecated

    // Allow communication only on HTTPS
    app.use(helmet.hsts());

    // TODO: Add another vuln: https://github.com/helmetjs/helmet/issues/26
    // Enable XSS filter in IE (On by default)
    // app.use(helmet.iexss());
    // Now it should be used in hit way, but the README alerts that could be
    // dangerous, like specified in the issue.
    // app.use(helmet.xssFilter({ setOnOldIE: true }));

    // Forces browser to only use the Content-Type set in the response header instead of sniffing or guessing it
    app.use(nosniff());
    */

    // Adding/ remove HTTP Headers for security
    app.use(favicon(__dirname + "/app/assets/favicon.ico"));

    // Express middleware to populate "req.body" so we can access POST variables
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        // Mandatory in Express v4
        extended: false
    }));

    // Enable session management using express middleware
    app.use(session({
        // genid: (req) => {
        //    return genuuid() // use UUIDs for session IDs
        //},
        secret: cookieSecret,
        // Fix for A5 - Security MisConfig / CWE-522
        // Use a generic cookie name. The express-session default
        // ("connect.sid") fingerprints the framework in every response, which
        // helps an attacker pick stack-specific attacks. Nothing reads the
        // cookie by name (the client just echoes it back), so renaming it is
        // transparent to the app and to the e2e suite.
        name: cookieName,
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        cookie: {
            // Fix for A5 - Security MisConfig / CWE-522
            // Scope the session cookie explicitly instead of letting it default
            // to whatever host served the response. Falsy (unset COOKIE_DOMAIN)
            // keeps the cookie host-only so it is never shared with sub-domains.
            domain: cookieDomain
        }

        /*
        // Fix for A3 - XSS
        // TODO: Add "maxAge"
        cookie: {
            httpOnly: true
            // Remember to start an HTTPS server to get this working
            // secure: true
        }
        */

    }));

    /*
    // Fix for A8 - CSRF
    // Enable Express csrf protection
    app.use(csrf());
    // Make csrf token available in templates
    app.use((req, res, next) => {
        res.locals.csrftoken = req.csrfToken();
        next();
    });
    */

    // Register templating engine
    app.engine(".html", consolidate.swig);
    app.set("view engine", "html");
    app.set("views", `${__dirname}/app/views`);
    // Fix for A5 - Security MisConfig
    // TODO: make sure assets are declared before app.use(session())
    app.use(express.static(`${__dirname}/app/assets`));


    // Initializing marked library
    // Fix for A9 - Insecure Dependencies
    marked.setOptions({
        sanitize: true
    });
    app.locals.marked = marked;

    // Application routes
    routes(app, db);

    // Template system setup
    swig.setDefaults({
        // Autoescape disabled
        autoescape: false
        /*
        // Fix for A3 - XSS, enable auto escaping
        autoescape: true // default value
        */
    });

    // Fix for A6-Sensitive Data Exposure / CWE-319
    // Use the secure HTTPS protocol whenever TLS material was supplied at
    // runtime; only fall back to cleartext HTTP for local development, where no
    // key/cert pair is available.
    if (httpsOptions) {
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else {
        console.log("Warning: no TLS material configured - serving cleartext HTTP (development only)");
        http.createServer(app).listen(port, () => {
            console.log(`Express http server listening on port ${port}`);
        });
    }

});
