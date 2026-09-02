// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

// Whether the app should try to serve HTTPS. The TLS key/cert location is a
// fixed literal path inside server.js (artifacts/cert/server.key and
// server.crt) so that no configured string is ever used to build a filesystem
// path. The key is never committed: generate your own locally, e.g.
// openssl req -x509 -newkey rsa:4096 -nodes -days 365 \
//   -keyout artifacts/cert/server.key -out artifacts/cert/server.crt
// Set HTTPS_ENABLED=false to force the plain HTTP listener even when TLS
// material is present. When enabled but the key/cert are missing or
// unreadable, server.js falls back to HTTP so the app still starts.
const httpsEnabled = typeof process.env.HTTPS_ENABLED === "string" ?
    process.env.HTTPS_ENABLED === "true" : true;

// Domain the session cookie is scoped to. Set COOKIE_DOMAIN per deployment so
// the cookie is only sent back to that domain. When it is not configured the
// value stays undefined, which makes the browser store a host-only cookie (the
// most restrictive scope) and keeps local/demo runs working.
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

// Lifetime of the session cookie in milliseconds. Sessions must not live
// indefinitely, so express-session gets a bounded expiry (it renders the
// "Expires"/"Max-Age" cookie attributes from this value). Override per
// deployment with SESSION_TIMEOUT_MS; the default is 30 minutes of idle time,
// which is long enough for a normal browsing session (and the e2e suite).
const sessionTimeoutMs = parseInt(process.env.SESSION_TIMEOUT_MS, 10) || 30 * 60 * 1000;

// Whether the session cookie carries the "secure" attribute, i.e. the browser
// only sends it back over HTTPS. Leave COOKIE_SECURE unset (the default) to
// follow the transport the app actually serves: server.js enables it when the
// TLS key/cert are loaded and leaves it off for the plain HTTP
// fallback, so the flag and the listener can never disagree. Set
// COOKIE_SECURE=true when TLS is terminated in front of the app (proxy/LB).
const cookieSecure = typeof process.env.COOKIE_SECURE === "string" ?
    process.env.COOKIE_SECURE === "true" : undefined;

module.exports = {
    port,
    db,
    httpsEnabled,
    cookieDomain,
    cookieSecure,
    sessionTimeoutMs,
    cookieSecret: "session_cookie_secret_key_here",
    cryptoKey: "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

