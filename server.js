"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require("csurf");
const consolidate = require("consolidate"); // Templating library adapter for Express
const swig = require("swig");
// const helmet = require("helmet");
const MongoClient = require("mongodb").MongoClient; // Driver for connecting to MongoDB
const http = require("http");
const marked = require("marked");
//const nosniff = require('dont-sniff-mimetype');
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config"); // Application config properties
// Fix for A6-Sensitive Data Exposure / CWE-319 Cleartext Transmission
// Load keys for establishing secure HTTPS connection.
// NOTE: no private key/cert material is committed to this repo. Provide your
// own locally-generated key/cert pair at the fixed path below (see
// artifacts/cert/server.key for how to generate one for local/dev use). Do
// not commit real key material.
const fs = require("fs");
const https = require("https");
const path = require("path");
// Fix for CWE-22 Path Traversal: load TLS key/cert material from a fixed,
// hardcoded path instead of an env-var-controlled path. No user/env-
// controlled input reaches the filesystem here.
const tlsKeyPath = path.resolve(__dirname, "artifacts/cert/server.key");
const tlsCertPath = path.resolve(__dirname, "artifacts/cert/server.crt");
const httpsOptions = fs.existsSync(tlsKeyPath) && fs.existsSync(tlsCertPath) ? {
    key: fs.readFileSync(tlsKeyPath),
    cert: fs.readFileSync(tlsCertPath)
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
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        // Fix for A5 - Security MisConfig / CWE-522
        // Use a generic, non-fingerprintable cookie name instead of the
        // express-session default ("connect.sid"), which leaks the
        // framework in use to attackers.
        name: "sessionId",

        // Fix for CWE-522 - Insufficiently Protected Credentials
        // Scope the session cookie to a specific host via COOKIE_DOMAIN.
        // Left undefined (and therefore omitted by the `cookie` module) when
        // the env var isn't set, so dev/test environments with varying
        // hostnames aren't broken.
        cookie: {
            domain: process.env.COOKIE_DOMAIN || undefined,
            // Fix for CWE-522 - Insufficiently Protected Credentials
            // Explicitly scope the session cookie to all paths under this
            // app (login, dashboard, profile, etc. live at different
            // top-level paths), making the default intentional rather
            // than left unset.
            path: "/",
            // Fix for CWE-522 - Insufficiently Protected Credentials
            // Give the session cookie a defined, bounded lifetime instead
            // of leaving it as a browser-session-only cookie with no
            // expiration. express-session derives/updates the `Expires`
            // attribute from `maxAge` on each response.
            maxAge: 30 * 60 * 1000, // 30 minutes
            // Fix for A3 - XSS / CWE-522
            // Prevent client-side JavaScript from reading the session
            // cookie, mitigating cookie theft via XSS.
            httpOnly: true,
            // Fix for CWE-522 - Insufficiently Protected Credentials
            // Only mark the cookie Secure when the server is actually
            // serving over HTTPS (TLS key/cert material found at the
            // fixed artifacts/cert path and loaded into httpsOptions
            // above). Hardcoding `true` would stop browsers from sending
            // the cookie back over the plain-HTTP fallback used in
            // dev/test/CI, breaking login/session for every environment
            // without real certs.
            secure: Boolean(httpsOptions)
        }
    }));

    // Fix for A8 - CSRF
    // Enable Express csrf protection
    app.use(csrf());
    // Make csrf token available in templates
    app.use((req, res, next) => {
        res.locals.csrftoken = req.csrfToken();
        next();
    });

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

    // Fix for A6-Sensitive Data Exposure / CWE-319 Cleartext Transmission
    // Use secure HTTPS protocol when TLS material is present at the fixed
    // artifacts/cert/server.key + server.crt path. Fall back to plain HTTP
    // (with a warning) so existing dev/test/CI workflows that don't
    // provide certs keep working unchanged.
    if (httpsOptions) {
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else {
        console.warn("TLS key/cert material not found at artifacts/cert/; falling back to insecure HTTP. Do not use this in production.");
        http.createServer(app).listen(port, () => {
            console.log(`Express http server listening on port ${port}`);
        });
    }

});
