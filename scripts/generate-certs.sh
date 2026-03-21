#!/bin/bash
# ============================================================
# RadiusServer – TLS Certificate Generator
# ============================================================
# Generates a self-signed CA and server certificate for
# RadSec and HTTPS development use. NOT for production.
# For production, use real certificates from a trusted CA.
# ============================================================
set -e

CERT_DIR="/etc/raddb/certs"
CA_DAYS=3650
SERVER_DAYS=825
KEY_SIZE=4096

log() {
    echo "[certs] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# ---- CA Certificate ----
if [ ! -f ca.pem ]; then
    log "Generating CA private key..."
    openssl genrsa -out ca.key "$KEY_SIZE"
    chmod 600 ca.key

    log "Generating CA certificate..."
    openssl req -new -x509 -key ca.key -out ca.pem -days "$CA_DAYS" \
        -subj "/C=US/ST=State/L=City/O=RadiusServer/OU=CA/CN=RadiusServer CA"
    log "CA certificate created."
else
    log "CA certificate already exists."
fi

# ---- Server Certificate ----
if [ ! -f server.pem ]; then
    log "Generating server private key..."
    openssl genrsa -out server.key "$KEY_SIZE"
    chmod 600 server.key

    log "Creating server CSR..."
    openssl req -new -key server.key -out server.csr \
        -subj "/C=US/ST=State/L=City/O=RadiusServer/OU=Server/CN=radiusserver"

    # Extensions for SAN
    cat > server.ext <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,nonRepudiation,keyEncipherment,dataEncipherment
extendedKeyUsage=serverAuth,clientAuth
subjectAltName=@alt_names

[alt_names]
DNS.1=radiusserver
DNS.2=localhost
IP.1=127.0.0.1
EOF

    log "Signing server certificate with CA..."
    openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key \
        -CAcreateserial -out server.pem -days "$SERVER_DAYS" \
        -extfile server.ext

    rm -f server.csr server.ext

    log "Server certificate created."
else
    log "Server certificate already exists."
fi

# ---- Client Certificate (for RadSec clients) ----
if [ ! -f client.pem ]; then
    log "Generating client private key..."
    openssl genrsa -out client.key "$KEY_SIZE"
    chmod 600 client.key

    log "Creating client CSR..."
    openssl req -new -key client.key -out client.csr \
        -subj "/C=US/ST=State/L=City/O=RadiusServer/OU=Client/CN=radsec-client"

    log "Signing client certificate with CA..."
    openssl x509 -req -in client.csr -CA ca.pem -CAkey ca.key \
        -CAcreateserial -out client.pem -days "$SERVER_DAYS"

    rm -f client.csr

    log "Client certificate created."
else
    log "Client certificate already exists."
fi

# ---- DH Parameters ----
if [ ! -f dh.pem ]; then
    log "Generating DH parameters (this takes a while)..."
    openssl dhparam -out dh.pem 2048
    log "DH parameters generated."
else
    log "DH parameters already exist."
fi

# ---- Set permissions ----
chown -R radius:radius "$CERT_DIR"
chmod 640 "$CERT_DIR"/*.pem "$CERT_DIR"/*.key 2>/dev/null || true

log "Certificate generation complete."
log "Files in $CERT_DIR:"
ls -la "$CERT_DIR"
