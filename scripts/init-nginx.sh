#!/bin/sh
# init-nginx.sh — Generate nginx config from template

set -e

DOMAIN="${NGINX_SERVER_NAME:-yotop10.local}"
CERT_DIR="${NGINX_CERT_DIR:-/etc/letsencrypt/live/${DOMAIN}}"

echo "[Nginx] Configuring for domain: ${DOMAIN}"

# Generate self-signed cert if missing (for dev / first boot)
if [ ! -f "${CERT_DIR}/fullchain.pem" ] || [ ! -f "${CERT_DIR}/privkey.pem" ]; then
  echo "[Nginx] Cert not found at ${CERT_DIR}, generating self-signed..."
  # Try CERT_DIR, fallback to /etc/nginx/certs if read-only
  TARGET_DIR="${CERT_DIR}"
  if ! mkdir -p "${TARGET_DIR}" 2>/dev/null; then
    echo "[Nginx] ${CERT_DIR} is read-only, using /etc/nginx/certs"
    TARGET_DIR="/etc/nginx/certs/${DOMAIN}"
    mkdir -p "${TARGET_DIR}"
    CERT_DIR="${TARGET_DIR}"
  fi
  if ! command -v openssl >/dev/null 2>&1; then
    apk add --no-cache openssl >/dev/null 2>&1 || true
  fi
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${TARGET_DIR}/privkey.pem" \
    -out "${TARGET_DIR}/fullchain.pem" \
    -subj "/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN},DNS:www.${DOMAIN}" 2>/dev/null || {
      echo "[Nginx] openssl failed, creating dummy cert"
      mkdir -p "${TARGET_DIR}"
      echo "dummy" > "${TARGET_DIR}/fullchain.pem"
      echo "dummy" > "${TARGET_DIR}/privkey.pem"
    }
  cp "${TARGET_DIR}/fullchain.pem" "${TARGET_DIR}/chain.pem" 2>/dev/null || true
  CERT_DIR="${TARGET_DIR}"
  echo "[Nginx] Self-signed cert generated at ${TARGET_DIR}"
fi

sed \
  -e "s/__DOMAIN_PLACEHOLDER__/${DOMAIN}/g" \
  -e "s|__CERT_PLACEHOLDER__|${CERT_DIR}|g" \
  /templates/nginx.conf > /etc/nginx/conf.d/default.conf

echo "[Nginx] Config generated successfully"
