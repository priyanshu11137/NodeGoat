# Local TLS material for the optional HTTPS server

TLS keys and certificates are **never committed** to this repository. The
previously checked-in `server.key` / `server.crt` pair (an expired, self-signed
demo pair) has been removed, and `*.key` / `*.crt` / `*.pem` files are ignored
by git.

Generate your own local development pair when you want to run the HTTPS server
described in the A6 - Sensitive Data Exposure tutorial. The file names are
fixed - `server.key` and `server.crt` inside this directory:

```
openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
  -keyout artifacts/cert/server.key \
  -out artifacts/cert/server.crt \
  -subj "/CN=localhost"
```

That is all the configuration there is: `server.js` builds the two paths from
its own directory plus those literal names, so there is no environment variable
to set (the former `HTTPS_KEY_PATH` / `HTTPS_CERT_PATH` variables have been
removed - accepting a path from the environment was a path traversal sink).

When both files are present and readable the app starts an HTTPS listener with
`minVersion: TLSv1.2`; otherwise it logs that TLS is disabled and falls back to
the plain HTTP listener, so a checkout without certificates (CI, e2e tests)
still starts. Keep the generated key readable only by your user, and never add
it to a commit, image, or PR.
