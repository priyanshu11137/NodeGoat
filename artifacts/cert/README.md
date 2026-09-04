# Local TLS material for the optional HTTPS server

TLS keys and certificates are **never committed** to this repository. The
previously checked-in `server.key` / `server.crt` pair (an expired, self-signed
demo pair) has been removed, and `*.key` / `*.crt` / `*.pem` files are ignored
by git.

Generate your own local development pair when you want to run the HTTPS server
described in the A6 - Sensitive Data Exposure tutorial:

```
openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
  -keyout artifacts/cert/server.key \
  -out artifacts/cert/server.crt \
  -subj "/CN=localhost"
```

Then point the application at the generated files with environment variables,
the same way `PORT` and `MONGODB_URI` are provided (see the README):

```
export HTTPS_KEY_PATH=artifacts/cert/server.key
export HTTPS_CERT_PATH=artifacts/cert/server.crt
```

`server.js` reads those variables in the HTTPS section. Keep the generated key
readable only by your user, and never add it to a commit, image, or PR.
