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
    cryptoKey: "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

