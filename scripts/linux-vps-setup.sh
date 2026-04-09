#!/bin/bash
# =====================================================
#  Built By Borch — Linux (Ubuntu) VPS Setup Script
#  Pro setup: Nginx + Node.js + PM2
#  Kør med: sudo bash linux-vps-setup.sh
# =====================================================

set -e

echo ""
echo "===================================="
echo " BUILT BY BORCH — LINUX VPS SETUP"
echo "===================================="
echo ""

# --- Tjek root ---
if [ "$EUID" -ne 0 ]; then
    echo "[FEJL] Kør som root: sudo bash linux-vps-setup.sh"
    exit 1
fi

# --- System update ---
echo "[1/7] Opdaterer system..."
apt update && apt upgrade -y

# --- Installer Node.js (LTS) ---
echo ""
echo "[2/7] Installerer Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
echo "[OK] Node.js $(node -v) installeret"
echo "[OK] npm $(npm -v) installeret"

# --- Installer PM2 ---
echo ""
echo "[3/7] Installerer PM2..."
npm install -g pm2
echo "[OK] PM2 $(pm2 -v) installeret"

# --- Installer Nginx ---
echo ""
echo "[4/7] Installerer Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
echo "[OK] Nginx installeret og kører"

# --- Opsæt firewall ---
echo ""
echo "[5/7] Konfigurerer firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable
echo "[OK] Firewall konfigureret"

# --- Spørg om site detaljer ---
echo ""
read -p "Dit domæne (fx ditdomæne.dk): " DOMAIN
read -p "Sti til din app (fx /var/www/mit-site): " APP_DIR
read -p "App fil navn (fx app.js): " APP_FILE
read -p "Port din app kører på (fx 3000): " APP_PORT

# --- Opret Nginx config ---
echo ""
echo "[6/7] Opsætter Nginx reverse proxy..."

cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "[OK] Nginx konfigureret for $DOMAIN"

# --- Start app med PM2 ---
echo ""
echo "[7/7] Starter app med PM2..."

if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    npm install
    pm2 start "$APP_FILE" --name "$DOMAIN"
    pm2 save
    pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
    echo "[OK] App kører med PM2"
else
    echo "[INFO] Mappen $APP_DIR findes ikke endnu."
    echo "       Upload din app og kør:"
    echo "       cd $APP_DIR && npm install"
    echo "       pm2 start $APP_FILE --name $DOMAIN"
    echo "       pm2 save"
fi

echo ""
echo "===================================="
echo " SETUP FÆRDIG!"
echo "===================================="
echo ""
echo "Status:"
echo "  Nginx:  systemctl status nginx"
echo "  PM2:    pm2 list"
echo "  Logs:   pm2 logs"
echo ""
echo "Næste skridt:"
echo "  1. Peg dit domæne ($DOMAIN) til denne servers IP"
echo "  2. Installer SSL med:"
echo "     apt install certbot python3-certbot-nginx"
echo "     certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "  SSL fornyes automatisk via certbot timer."
echo ""
