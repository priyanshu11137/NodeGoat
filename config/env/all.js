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
// Absolute cap on the lifetime of a single session. "sessionMaxAge" is only an
// idle window: express-session touches the session on every request, sliding
// both the cookie and the store expiry forward, so a session that is kept warm
// never expires. Override SESSION_ABSOLUTE_TIMEOUT_MINUTES per deployment;
// a value that is not a positive whole number of minutes falls back to the
// default so a bad value can never disable the cap.
const configuredSessionAbsoluteTimeout = Number.parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_MINUTES, 10);
const sessionAbsoluteTimeoutMinutes =
    Number.isInteger(configuredSessionAbsoluteTimeout) && configuredSessionAbsoluteTimeout > 0 ?
    configuredSessionAbsoluteTimeout :
    480;
const sessionAbsoluteMaxAge = sessionAbsoluteTimeoutMinutes * 60 * 1000;
// Whether the session cookie must carry the "Secure" attribute, so the session
// identifier can never travel in cleartext. Secure-on by default, and it fails
// secure: production - and an unset NODE_ENV on a real host - stay on. It is
// only dropped for an explicitly local run (NODE_ENV development/test, which is
// what the e2e suite uses over http://localhost, or an unset NODE_ENV while the
// app is served on a loopback host) or when COOKIE_SECURE is set to a false
// value. Deployments terminating TLS at a proxy keep COOKIE_SECURE on and grant
// Express "trust proxy" to that proxy only; a blanket trust would let any client
// spoof X-Forwarded-Proto.
const LOCAL_ENVIRONMENTS = ["development", "test"];
const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];
const FALSE_VALUES = ["false", "0", "no", "off"];
const nodeEnv = (process.env.NODE_ENV || "").trim().toLowerCase();
const isLocalRuntime = LOCAL_ENVIRONMENTS.indexOf(nodeEnv) !== -1 ||
    (!nodeEnv && LOOPBACK_HOSTS.indexOf(hostName.trim().toLowerCase()) !== -1);
const configuredCookieSecure = (process.env.COOKIE_SECURE || "").trim().toLowerCase();
const cookieSecure = configuredCookieSecure ?
    FALSE_VALUES.indexOf(configuredCookieSecure) === -1 :
    !isLocalRuntime;

module.exports = {
    port,
    db,
    cookieSecret: "session_cookie_secret_key_here",
    cookieDomain,
    cookieSecure,
    sessionMaxAge,
    sessionAbsoluteMaxAge,
    cryptoKey: "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName,
    environmentalScripts: []
};

