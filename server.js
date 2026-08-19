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
const fs = require("fs");
const https = require("https");
const path = require("path");
const tlsKeyPath = path.resolve(__dirname, "./artifacts/cert/server.key");
const tlsCertPath = path.resolve(__dirname, "./artifacts/cert/server.crt");
const httpsOptions = {
    key: fs.existsSync(tlsKeyPath) ? fs.readFileSync(tlsKeyPath) : null,
    cert: fs.existsSync(tlsCertPath) ? fs.readFileSync(tlsCertPath) : null
};
const marked = require("marked");
//const nosniff = require('dont-sniff-mimetype');
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config"); // Application config properties

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
        // Use a custom name to avoid default "connect.sid" fingerprinting
        name: "sessionId",
        secret: cookieSecret,
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        // Secure cookie settings: httpOnly prevents JS access, sameSite mitigates CSRF,
        // path restricts cookie scope, maxAge limits session lifetime to 1 hour
        cookie: {
            httpOnly: true,
            // secure: true required — app is served exclusively over HTTPS (https.createServer)
            secure: true,
            sameSite: "strict",
            path: "/",
            // domain set to empty string so the browser uses the current host (no cross-domain leakage)
            domain: "",
            maxAge: 3600000,
            expires: new Date(Date.now() + 3600000)
        }

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

    // Production: HTTPS required. Development/test: HTTP fallback when certs absent.
    const certReady = httpsOptions.key && httpsOptions.cert;
    if (certReady) {
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else if (process.env.NODE_ENV !== "production") {
        const http = require("http");
        http.createServer(app).listen(port, () => {
            console.log(`Express http server listening on port ${port} (dev/test)`);
        });
    } else {
        console.error("FATAL: TLS cert files missing in production. Exiting.");
        process.exit(1);
    }

});
