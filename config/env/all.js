// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";
const hostName = process.env.HOST_NAME || "localhost";
// Scope of the session cookie. Set COOKIE_DOMAIN per deployment so the cookie
// is never sent to unrelated hosts; defaults to the host the app is served on.
const cookieDomain = process.env.COOKIE_DOMAIN || hostName;

module.exports = {
    port,
    db,
    cookieSecret: "session_cookie_secret_key_here",
    cookieDomain,
    cryptoKey: "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName,
    environmentalScripts: []
};

