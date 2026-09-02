// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

module.exports = {
    port,
    db,
    cookieSecret: "session_cookie_secret_key_here",
    // Explicit cookie domain for the session cookie. Left undefined by default
    // (no behavior change) unless COOKIE_DOMAIN is set in the environment.
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    cryptoKey: "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

