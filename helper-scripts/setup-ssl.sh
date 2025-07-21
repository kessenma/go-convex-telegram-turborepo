#!/bin/bash

# SSL Setup Script for Convex Backend
# This script sets up SSL certificates using Let's Encrypt for the Convex backend

set -e

echo "Setting up SSL certificates for Convex backend..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root (use sudo)"
    exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Stop any existing nginx containers to free up port 80
echo "Stopping any existing nginx containers..."
docker-compose stop nginx-ssl-proxy 2>/dev/null || true

# Obtain SSL certificate using standalone mode
echo "Obtaining SSL certificate for 157.180.80.201..."
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@157.180.80.201 \
    --domains 157.180.80.201

echo "SSL certificate obtained successfully!"
echo "Certificate location: /etc/letsencrypt/live/157.180.80.201/"

# Set up auto-renewal
echo "Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'docker-compose restart nginx-ssl-proxy'") | crontab -

echo "SSL setup complete!"
echo "You can now start the nginx-ssl-proxy service with: docker-compose up -d nginx-ssl-proxy"
echo "The certificates will auto-renew and restart nginx when needed."