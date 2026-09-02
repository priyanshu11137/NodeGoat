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
const { port, db, cookieSecret, cookieDomain } = require("./config/config"); // Application config properties

// Fix for A6-Sensitive Data Exposure / CWE-319 (Cleartext Transmission)
// Load keys for establishing a secure HTTPS connection when TLS material is
// actually configured/available. TLS_KEY_PATH / TLS_CERT_PATH allow pointing
// at real certificate material (e.g. issued via a secrets manager); the
// artifacts/cert paths are used as a local-dev default when present.
// Guarded with fs.existsSync so a missing/placeholder cert never crashes the
// process -- in that case the server safely falls back to plain HTTP so
// local dev/test workflows keep working.
const tlsKeyPath = process.env.TLS_KEY_PATH || path.resolve(__dirname, "./artifacts/cert/server.key");
const tlsCertPath = process.env.TLS_CERT_PATH || path.resolve(__dirname, "./artifacts/cert/server.crt");

function loadHttpsOptions() {
    if (!fs.existsSync(tlsKeyPath) || !fs.existsSync(tlsCertPath)) {
        return null;
    }
    try {
        return {
            key: fs.readFileSync(tlsKeyPath),
            cert: fs.readFileSync(tlsCertPath)
        };
    } catch (err) {
        console.log("Warning: unable to read TLS key/cert material, falling back to HTTP");
        console.log(err.message);
        return null;
    }
}

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

    // Fix for A6-Sensitive Data Exposure / CWE-319 (Cleartext Transmission)
    // Determine up-front (before the session middleware is registered) whether
    // this process is actually going to serve HTTPS, so the session cookie's
    // `secure` flag below can reflect reality instead of being hardcoded.
    const httpsOptions = loadHttpsOptions();
    const isHttps = !!httpsOptions;

    // Enable session management using express middleware
    app.use(session({
        // genid: (req) => {
        //    return genuuid() // use UUIDs for session IDs
        //},
        secret: cookieSecret,
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        // Fix for javascript.express.security.audit.express-cookie-settings.express-cookie-session-default-name
        // Use a non-default cookie name so the session cookie doesn't reveal the underlying stack
        name: "sessionId",
        cookie: {
            // Fix for javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-domain
            // Explicitly set the cookie domain (configurable via COOKIE_DOMAIN env var) instead of
            // relying on the implicit browser default. Left undefined when unset, so behavior
            // is unchanged in local/dev environments without a fixed domain.
            domain: cookieDomain,
            // Fix for javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-path
            // Explicitly set the cookie path so its scope is not left to the implicit default.
            path: "/",
            // Fix for javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-expires
            // Explicitly set a session timeout (30 minutes) via maxAge (ms). express-session derives
            // the cookie's Expires attribute from maxAge, which is the recommended way to set it.
            maxAge: 30 * 60 * 1000,
            // Fix for javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-httponly
            // Prevent client-side JS from accessing the session cookie (mitigates session-token theft via XSS).
            httpOnly: true,
            // Fix for javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure
            // Mark the cookie Secure only when this process is actually serving HTTPS (real TLS
            // key/cert material configured -- see loadHttpsOptions()/isHttps above). Browsers drop
            // Secure cookies sent over plain HTTP, so hardcoding `true` would break session-based
            // functionality (login, etc.) in the current dev/test setup which has no valid cert;
            // this becomes `true` automatically once TLS material is provisioned.
            secure: isHttps
        }

    }));

    // Fix for A8 / CWE-352 - CSRF
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

    // Fix for A6-Sensitive Data Exposure / CWE-319 (Cleartext Transmission)
    // Use secure HTTPS when valid TLS key/cert material is configured and
    // available; otherwise fall back to plain HTTP so local dev/test setups
    // (which have no real certificate provisioned) keep working unchanged.
    // (httpsOptions/isHttps computed earlier, before session middleware registration,
    // so the session cookie's `secure` flag above can reflect this.)
    if (httpsOptions) {
        try {
            https.createServer(httpsOptions, app).listen(port, () => {
                console.log(`Express https server listening on port ${port}`);
            });
        } catch (err) {
            console.log("Warning: failed to start HTTPS server, falling back to HTTP");
            console.log(err.message);
            http.createServer(app).listen(port, () => {
                console.log(`Express http server listening on port ${port}`);
            });
        }
    } else {
        http.createServer(app).listen(port, () => {
            console.log(`Express http server listening on port ${port}`);
        });
    }

});
