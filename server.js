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
const https = require("https");
const fs = require("fs");
const path = require("path");
const marked = require("marked");
//const nosniff = require('dont-sniff-mimetype');
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
// Application config properties
const {
    port,
    db,
    cookieSecret,
    cookieDomain,
    sessionTimeoutMs,
    httpsKeyPath,
    httpsCertPath
} = require("./config/config");

// Fix for A6-Sensitive Data Exposure
// Load keys for establishing a secure HTTPS connection.
// The private key is NOT stored in this repository: generate your own key/cert
// and set HTTPS_KEY_PATH / HTTPS_CERT_PATH (see config/env/all.js).
// When no readable TLS material is configured we keep serving plain HTTP so
// local runs, docker-compose and CI can still boot the app.
const loadHttpsOptions = () => {
    if (!httpsKeyPath || !httpsCertPath) {
        return null;
    }
    try {
        return {
            key: fs.readFileSync(path.resolve(__dirname, httpsKeyPath)),
            cert: fs.readFileSync(path.resolve(__dirname, httpsCertPath))
        };
    } catch (err) {
        console.log(`TLS key/cert not available (${err.code}), starting without TLS`);
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
        secret: cookieSecret,
        // Fix for A5 - Security MisConfig
        // Use a generic cookie name instead of the express-session default
        // ("connect.sid") so the response does not fingerprint the framework.
        name: "sessionId",
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        // Fix for A5 - Security MisConfig
        // Restrict which domain the session cookie is sent to. Configured via
        // COOKIE_DOMAIN (see config/env/all.js); when unset it stays undefined
        // so the browser keeps a host-only cookie and local runs still work.
        // Fix for A5 - Security MisConfig
        // Scope the session cookie to an explicit path instead of relying on the
        // default. Authenticated pages are served from the site root (/dashboard,
        // /profile, /benefits, /memos, /contributions, /learn), so "/" is the
        // narrowest path that still covers every existing route.
        // Fix for A2 - Broken Authentication and Session Management
        // Give the session cookie a bounded expiry ("maxAge" is the
        // express-session idiom: it emits Expires/Max-Age relative to each
        // response instead of a fixed date baked in at boot) so sessions do not
        // live indefinitely. Tunable via SESSION_TIMEOUT_MS, default 30 minutes.
        cookie: {
            domain: cookieDomain,
            path: "/",
            maxAge: sessionTimeoutMs
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
    // Enable Express csrf protection. The token secret is stored in the session
    // ("cookie: false") which is why this must be registered after the session
    // middleware and after the body parsers, so the "_csrf" field posted by the
    // forms can be read. Every state changing request (POST/PUT/PATCH/DELETE)
    // must now carry a token matching the one issued for the session.
    app.use(csrf({
        cookie: false
    }));
    // Make csrf token available in templates: Express merges "res.locals" into
    // the render options, so every view can render {{csrftoken}} in a hidden
    // form field without each route handler having to pass it explicitly.
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
    // Use the secure HTTPS protocol whenever TLS material is configured and
    // readable; otherwise fall back to HTTP so the app still starts.
    const httpsOptions = loadHttpsOptions();
    if (httpsOptions) {
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else {
        http.createServer(app).listen(port, () => {
            console.log(`Express http server listening on port ${port} - TLS disabled, no key/cert configured`);
        });
    }

});
