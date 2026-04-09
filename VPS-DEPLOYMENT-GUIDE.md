# VPS Deployment Guide — Node.js + PM2 + XAMPP

Komplet guide fra du får din VPS til alt er live og kørende.

---

## Fase 1: Klargør din VPS (Windows + XAMPP)

### 1.1 Installer XAMPP

Download fra: [https://www.apachefriends.org](https://www.apachefriends.org)

Start XAMPP Control Panel og aktiver:
- **Apache** ✅
- **MySQL** (kun hvis du bruger lokal database)

XAMPP bruges her til: Apache som reverse proxy + let server management.

### 1.2 Installer Node.js

Download fra: [https://nodejs.org](https://nodejs.org) (LTS version)

Tjek installation:

```bash
node -v
npm -v
```

### 1.3 Installer PM2 (globalt)

```bash
npm install -g pm2
```

Tjek:

```bash
pm2 -v
```

---

## Fase 2: Upload din hjemmeside til VPS

### Muligheder

- **FTP** via FileZilla
- **Git clone** fra dit repository
- **Remote Desktop** copy/paste

### Eksempel struktur

```
C:\websites\mit-site\
 ├── app.js
 ├── package.json
 ├── public\
```

### Installer dependencies

```bash
cd C:\websites\mit-site
npm install
```

---

## Fase 3: Start din Node.js app med PM2

### Start app

```bash
pm2 start app.js --name "mit-site"
```

### Se status

```bash
pm2 list
```

### Auto-start ved reboot

```bash
pm2 startup
pm2 save
```

Nu kører din app konstant i baggrunden.

---

## Fase 4: Opsæt Apache (XAMPP) som reverse proxy

Node kører typisk på port 3000. Vi vil have: `ditdomæne.dk → Node app`

### 4.1 Aktivér Apache moduler

Åbn filen:

```
xampp/apache/conf/httpd.conf
```

Find og fjern `#` foran disse tre linjer:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule rewrite_module modules/mod_rewrite.so
```

### 4.2 Virtual Host setup

Åbn filen:

```
xampp/apache/conf/extra/httpd-vhosts.conf
```

Tilføj:

```apache
<VirtualHost *:80>
    ServerName ditdomæne.dk
    ServerAlias www.ditdomæne.dk

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog "logs/mit-site-error.log"
    CustomLog "logs/mit-site-access.log" combined
</VirtualHost>
```

### 4.3 Hosts file (kun til lokal test)

Hvis domænet ikke peger endnu:

```
C:\Windows\System32\drivers\etc\hosts
```

Tilføj:

```
127.0.0.1 ditdomæne.dk
```

### 4.4 Restart Apache

Via XAMPP Control Panel → Stop Apache → Start Apache.

---

## Fase 5: Peg domæne til din VPS

Hos din DNS-udbyder (fx Cloudflare, Simply, One.com):

| Type | Navn | Værdi |
|------|------|-------|
| A | @ | DIN VPS IP |
| A | www | DIN VPS IP |

DNS propagation tager typisk 5-30 minutter (op til 48 timer).

---

## Fase 6: SSL / HTTPS

XAMPP er ikke optimal til SSL i produktion. Brug en af disse:

### Cloudflare (anbefalet — nemmest)

1. Opret konto på [cloudflare.com](https://cloudflare.com)
2. Tilføj dit domæne
3. Skift nameservers hos din registrar til Cloudflare
4. Aktivér "Full" SSL mode
5. Gratis SSL + DDoS protection + CDN

### Let's Encrypt (manuelt på Windows)

Mere bøvlet, men muligt via [win-acme](https://www.win-acme.com/).

---

## Fase 7: PM2 commands du SKAL kende

| Kommando | Beskrivelse |
|----------|-------------|
| `pm2 list` | Se alle kørende apps |
| `pm2 logs` | Se logs i realtid |
| `pm2 logs mit-site` | Logs for specifik app |
| `pm2 restart mit-site` | Restart app |
| `pm2 stop mit-site` | Stop app |
| `pm2 delete mit-site` | Fjern app fra PM2 |
| `pm2 monit` | Overvåg CPU/RAM |
| `pm2 save` | Gem nuværende app-liste |
| `pm2 startup` | Auto-start ved reboot |

---

## Typiske fejl og fixes

### "Not Found"

- Apache peger forkert → tjek VirtualHost config
- Node app kører ikke → `pm2 list` og tjek status
- Forkert port → sikr at ProxyPass matcher din app port

### Virker på mobil men ikke PC

Klassisk DNS/cache problem:

```bash
ipconfig /flushdns
```

Tjek også:
- Hosts file (fjern test-entries)
- Browser cache (hard refresh: Ctrl+Shift+R)

### Port allerede i brug

Skift port i din app:

```javascript
app.listen(3001)
```

Og opdater VirtualHost:

```apache
ProxyPass / http://localhost:3001/
ProxyPassReverse / http://localhost:3001/
```

---

## Reality Check: Nuværende vs. Pro setup

### Din nuværende stack

```
Windows VPS → XAMPP → Apache → reverse proxy → Node.js + PM2
```

Det virker. Det er en valid løsning.

### Pro setup (når du er klar til at opgradere)

```
Linux VPS (Ubuntu) → Nginx → reverse proxy → Node.js + PM2
```

Fordele ved Linux + Nginx:
- Hurtigere (lavere resource forbrug)
- Mere stabilt (ingen random Windows updates)
- Standard i industrien (nemmere at finde hjælp)
- Billigere VPS priser
- Bedre sikkerhed

---

## Quick Start Cheatsheet

```bash
# 1. Installer dependencies
cd C:\websites\mit-site
npm install

# 2. Start med PM2
pm2 start app.js --name "mit-site"

# 3. Gem og auto-start
pm2 save
pm2 startup

# 4. Tjek status
pm2 list
pm2 logs
```

---

*Guide til Built By Borch — Coach Connect Hub deployment*
