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
const fs = require("fs");
const https = require("https");
const path = require("path");
const marked = require("marked");
//const nosniff = require('dont-sniff-mimetype');
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret, cookieDomain, sessionMaxAge } = require("./config/config"); // Application config

// Fix for A6-Sensitive Data Exposure
// Load keys for establishing a secure HTTPS connection.
// TLS material is never committed: provide the paths through the
// HTTPS_KEY_PATH / HTTPS_CERT_PATH environment variables and generate a local
// development pair as described in artifacts/cert/README.md
const loadHttpsOptions = () => {
    const keyPath = process.env.HTTPS_KEY_PATH;
    const certPath = process.env.HTTPS_CERT_PATH;
    if (!keyPath || !certPath) {
        return null;
    }
    try {
        return {
            key: fs.readFileSync(path.resolve(__dirname, keyPath)),
            cert: fs.readFileSync(path.resolve(__dirname, certPath)),
            // Modern TLS defaults: refuse the obsolete SSLv3/TLS 1.0/1.1 protocols
            // instead of pinning a single (soon deprecated) version
            minVersion: "TLSv1.2"
        };
    } catch (err) {
        console.log(`Error: TLS: cannot read the configured key/certificate (${err.code})`);
        return null;
    }
};

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
        // Fix for A5 - Security MisConfig
        // Use a generic session cookie name instead of the express-session
        // default ("connect.sid"), which fingerprints the stack to attackers
        name: "sessionId",
        secret: cookieSecret,
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        cookie: {
            // Restrict the session cookie to the configured host so it is not
            // shared with sibling sub-domains
            domain: cookieDomain,
            // Set the cookie scope explicitly instead of relying on the
            // browser default (the directory of the requesting URL). The app
            // serves authenticated pages from several top level paths, so the
            // session cookie is scoped to the application root.
            path: "/",
            // Fix for A3/A5 - bound the session lifetime instead of issuing a
            // cookie that lives for the whole browser session. "maxAge" is the
            // option express-session actually honours: it derives the cookie
            // "Expires"/"Max-Age" attribute from it for every new session and
            // expires the server side session at the same time. A literal
            // "expires" date would be evaluated once at start-up and shared by
            // all sessions, so it is deliberately not used here.
            maxAge: sessionMaxAge
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

    // Fix for A8 - CSRF
    // Enable Express csrf protection. The token is derived from a secret kept in
    // the user session, so every state changing request (POST/PUT/PATCH/DELETE)
    // must present it and is verified server side; GET/HEAD/OPTIONS are exempt.
    app.use(csrf());
    // Make the csrf token available to every template so each rendered form can
    // submit it in its hidden "_csrf" field.
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

    // Fix for A6-Sensitive Data Exposure
    // Use the secure HTTPS protocol whenever key/certificate material has been
    // configured. When it has not (fresh checkout, CI), fall back to the plain
    // express listener so the app still starts - certificates are never
    // generated or committed here, see artifacts/cert/README.md
    const httpsOptions = loadHttpsOptions();
    if (httpsOptions) {
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else {
        console.log("TLS is disabled: set HTTPS_KEY_PATH and HTTPS_CERT_PATH to serve over HTTPS " +
            "(see artifacts/cert/README.md). Do not expose this listener outside localhost.");
        app.listen(port, () => {
            console.log(`Express server listening on port ${port} without TLS`);
        });
    }

});
