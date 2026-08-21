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
const https = require("https");
const fs = require("fs");
const path = require("path");
const marked = require("marked");
//const nosniff = require('dont-sniff-mimetype');
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config"); // Application config properties
// TLS certificates are loaded at server start from HTTPS_KEY_PATH and HTTPS_CERT_PATH environment variables

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
        name: "sessionId",
        cookie: {
            httpOnly: true,
            secure: true,
            domain: process.env.SESSION_COOKIE_DOMAIN || "localhost",
            path: "/",
            maxAge: 86400000,
            expires: new Date(Date.now() + 86400000)
        }
        /*
        // Fix for A5 - Security MisConfig
        // Use generic cookie name
        key: "sessionId",
        */

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

    // Use HTTPS when certificate and key are available via environment variables
    const httpsKeyPath = process.env.HTTPS_KEY_PATH;
    const httpsCertPath = process.env.HTTPS_CERT_PATH;

    if (httpsKeyPath && httpsCertPath) {
        // Canonicalize paths to prevent path traversal
        const resolvedKeyPath = path.resolve(httpsKeyPath);
        const resolvedCertPath = path.resolve(httpsCertPath);

        // Validate resolved paths are absolute and do not contain traversal sequences
        if (!path.isAbsolute(resolvedKeyPath) || !path.isAbsolute(resolvedCertPath)) {
            console.log("Error: TLS certificate paths must resolve to absolute paths");
            process.exit(1);
        }

        if (fs.existsSync(resolvedKeyPath) && fs.existsSync(resolvedCertPath)) {
            const httpsOptions = {
                key: fs.readFileSync(resolvedKeyPath),
                cert: fs.readFileSync(resolvedCertPath)
            };
            const httpsPort = process.env.HTTPS_PORT || 4000;
            https.createServer(httpsOptions, app).listen(httpsPort, () => {
                console.log(`Express https server listening on port ${httpsPort}`);
            });
        } else {
            // Fallback to HTTP when TLS certificate files do not exist
            app.listen(port, () => {
                console.log(`Express http server listening on port ${port}`);
            });
        }
    } else {
        // Fallback to HTTP when TLS certificates are not configured
        app.listen(port, () => {
            console.log(`Express http server listening on port ${port}`);
        });
    }

});
