// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

// TLS key/cert are never committed: generate your own locally and (optionally)
// point these at them, e.g.
// openssl req -x509 -newkey rsa:4096 -nodes -days 365 \
//   -keyout artifacts/cert/server.key -out artifacts/cert/server.crt
const httpsKeyPath = process.env.HTTPS_KEY_PATH || "artifacts/cert/server.key";
const httpsCertPath = process.env.HTTPS_CERT_PATH || "artifacts/cert/server.crt";

// Domain the session cookie is scoped to. Set COOKIE_DOMAIN per deployment so
// the cookie is only sent back to that domain. When it is not configured the
// value stays undefined, which makes the browser store a host-only cookie (the
// most restrictive scope) and keeps local/demo runs working.
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

module.exports = {
    port,
    db,
    httpsKeyPath,
    httpsCertPath,
    cookieDomain,
    cookieSecret: "session_cookie_secret_key_here",
    cryptoKey: "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

