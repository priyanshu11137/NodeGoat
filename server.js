"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require("csurf"); // CSRF protection middleware (Fix for A8-CSRF)
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

// Support HTTPS when certificate files are available (Fix for A6-Sensitive Data Exposure)
const fs = require("fs");
const https = require("https");
const path = require("path");
const httpsCertPath = process.env.HTTPS_CERT || path.resolve(__dirname, "./artifacts/cert/server.crt");
const httpsKeyPath = process.env.HTTPS_KEY || path.resolve(__dirname, "./artifacts/cert/server.key");
const httpsAvailable = fs.existsSync(httpsCertPath) && fs.existsSync(httpsKeyPath);
const httpsOptions = httpsAvailable ? {
    key: fs.readFileSync(httpsKeyPath),
    cert: fs.readFileSync(httpsCertPath)
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
        secret: cookieSecret,
        // Use a custom session cookie name instead of the default "connect.sid"
        name: "sessionId",
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        cookie: {
            // Restrict JavaScript access to the cookie
            httpOnly: true,
            // Only transmit cookie over HTTPS in production
            secure: process.env.NODE_ENV === "production",
            // Restrict cookie to root path
            path: "/",
            // Set cookie domain per deployment environment
            domain: process.env.COOKIE_DOMAIN || undefined,
            // Expire cookie after 24 hours
            maxAge: process.env.SESSION_MAX_AGE * 1 || 86400000
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

    // Use HTTPS when cert files are available (Fix for A6-Sensitive Data Exposure / CWE-319),
    // otherwise fall back to HTTP for development environments without certificates.
    if (httpsAvailable) {
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else {
        // NOTE: CWE-319 - HTTP transmits data in cleartext. Use HTTPS in production.
        // Provide HTTPS_CERT and HTTPS_KEY environment variables pointing to valid
        // certificate files to enable HTTPS.
        http.createServer(app).listen(port, () => {
            console.log(`Express http server listening on port ${port} (no TLS certs found; HTTPS disabled)`);
        });
    }

});
