#!/bin/bash
# =============================================================================
# Generate self-signed certificates for localhost
# MOB Train Routing
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"

mkdir -p "$CERTS_DIR"

echo "Generating self-signed certificate for localhost..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/localhost.key" \
  -out "$CERTS_DIR/localhost.crt" \
  -subj "/C=CH/ST=Vaud/L=Montreux/O=MOB/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "$CERTS_DIR/localhost.key"
chmod 644 "$CERTS_DIR/localhost.crt"

echo ""
echo "Certificates generated in $CERTS_DIR"
echo ""
echo "To trust the certificate on macOS:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERTS_DIR/localhost.crt"
echo ""
echo "To trust the certificate on Linux (Ubuntu/Debian):"
echo "  sudo cp $CERTS_DIR/localhost.crt /usr/local/share/ca-certificates/mob-localhost.crt"
echo "  sudo update-ca-certificates"
echo ""
echo "Or simply accept the browser warning when accessing https://localhost"
