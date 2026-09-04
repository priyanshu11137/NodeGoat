// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";
const hostName = process.env.HOST_NAME || "localhost";
// Scope of the session cookie. Set COOKIE_DOMAIN per deployment so the cookie
// is never sent to unrelated hosts; defaults to the host the app is served on.
const cookieDomain = process.env.COOKIE_DOMAIN || hostName;
// Bounded lifetime of an authenticated session. A session cookie without an
// expiry lives as long as the browser process, so a stolen cookie could be
// replayed indefinitely. Override SESSION_TIMEOUT_MINUTES per deployment;
// anything that is not a positive whole number of minutes falls back to the
// default so a bad value can never disable the limit.
const configuredSessionTimeout = Number.parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10);
const sessionTimeoutMinutes = Number.isInteger(configuredSessionTimeout) && configuredSessionTimeout > 0 ?
    configuredSessionTimeout :
    60;
const sessionMaxAge = sessionTimeoutMinutes * 60 * 1000; // express-session expects milliseconds

module.exports = {
    port,
    db,
    cookieSecret: "session_cookie_secret_key_here",
    cookieDomain,
    sessionMaxAge,
    cryptoKey: "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName,
    environmentalScripts: []
};

