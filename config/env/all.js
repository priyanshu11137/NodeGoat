// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

module.exports = {
    port,
    db,
    cookieSecret: "session_cookie_secret_key_here",
    // Explicit scope for the session cookie. Set COOKIE_DOMAIN per environment
    // to the single host that should receive it. When unset the cookie stays
    // host-only, which is the narrowest scope and keeps local development
    // (localhost / 127.0.0.1) working.
    cookieDomain: process.env.COOKIE_DOMAIN || null,
    // Explicit, generic name for the session cookie. The express-session default
    // ("connect.sid") advertises the server stack to anyone inspecting the
    // response. Override with COOKIE_NAME per environment if desired.
    cookieName: process.env.COOKIE_NAME || "sessionId",
    // Bounded lifetime (in milliseconds) for the session cookie, so an
    // authenticated session credential cannot live on indefinitely in the
    // browser. Defaults to 30 minutes of inactivity, which suits a financial
    // application; override with COOKIE_MAX_AGE per environment.
    cookieMaxAge: Number(process.env.COOKIE_MAX_AGE) || 30 * 60 * 1000,
    // "Secure" attribute for the session cookie, so the credential is only ever
    // sent over HTTPS. It is on automatically whenever this process serves TLS
    // itself (TLS_KEY_PATH / TLS_CERT_PATH, see server.js); set
    // COOKIE_SECURE=true for deployments that terminate TLS in front of the app
    // (Heroku, a reverse proxy - also set TRUST_PROXY there). It stays off on
    // the plain-HTTP path used by local development and the e2e suite, where the
    // browser would drop a Secure cookie and every authenticated flow would fail.
    cookieSecure: process.env.COOKIE_SECURE ?
        process.env.COOKIE_SECURE.toLowerCase() === "true" :
        Boolean(process.env.TLS_KEY_PATH && process.env.TLS_CERT_PATH),
    // Number of reverse-proxy hops to trust ("trust proxy"), so Express can tell
    // that a proxy-terminated request arrived over HTTPS and therefore emits the
    // Secure session cookie. 0 (the default) trusts no forwarding headers at
    // all; set TRUST_PROXY=1 when exactly one proxy fronts the app, e.g. Heroku.
    trustProxy: Number(process.env.TRUST_PROXY) || 0,
    cryptoKey: "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

