# RadSec (RADIUS over TLS)

RadSec provides encrypted RADIUS communication over TCP port 2083 using mutual TLS authentication.

## Enabling RadSec

Set in your `.env` file:
```
RADSEC_ENABLED=true
```

## Certificate Generation

Certificates are automatically generated on first container start. To regenerate:

```bash
make certs
# or
docker compose exec radiusserver /scripts/generate-certs.sh
```

Generated certificates:
- `ca.pem` — Certificate Authority
- `server.pem` / `server.key` — Server certificate
- `client.pem` / `client.key` — Client certificate
- `dh.pem` — Diffie-Hellman parameters

## Client Configuration

Distribute the following to RadSec clients:
1. `ca.pem` — CA certificate for server verification
2. `client.pem` — Client certificate
3. `client.key` — Client private key

### Example: FreeRADIUS Client

```
home_server radsec_server {
    type = auth+acct
    ipaddr = <server-ip>
    port = 2083
    proto = tcp

    tls {
        private_key_file = /path/to/client.key
        certificate_file = /path/to/client.pem
        ca_file = /path/to/ca.pem
    }
}
```

## TLS Configuration

- Protocol: TLS 1.2+
- Cipher suites: DEFAULT:!EXPORT:!LOW:!MD5
- Mutual authentication: Required
- Certificate lifetime: 3650 days (CA), 825 days (server/client)
- Key size: 4096-bit RSA
