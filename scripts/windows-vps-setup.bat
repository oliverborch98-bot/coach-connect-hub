@echo off
REM =====================================================
REM  Built By Borch — Windows VPS Setup Script
REM  Kør som Administrator
REM =====================================================

echo.
echo ====================================
echo  BUILT BY BORCH — VPS SETUP
echo ====================================
echo.

REM --- Tjek Node.js ---
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [FEJL] Node.js er ikke installeret.
    echo Download fra: https://nodejs.org
    echo Installer LTS version og kør dette script igen.
    pause
    exit /b 1
)

echo [OK] Node.js fundet:
node -v

REM --- Installer PM2 ---
echo.
echo [INSTALL] Installerer PM2 globalt...
call npm install -g pm2
if %ERRORLEVEL% NEQ 0 (
    echo [FEJL] PM2 installation fejlede. Kør som Administrator.
    pause
    exit /b 1
)
echo [OK] PM2 installeret:
call pm2 -v

REM --- Opret website mappe ---
echo.
set /p SITE_DIR="Sti til din website mappe (fx C:\websites\mit-site): "

if not exist "%SITE_DIR%" (
    echo [FEJL] Mappen findes ikke: %SITE_DIR%
    pause
    exit /b 1
)

REM --- Installer dependencies ---
echo.
echo [INSTALL] Installerer npm dependencies...
cd /d "%SITE_DIR%"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [FEJL] npm install fejlede.
    pause
    exit /b 1
)
echo [OK] Dependencies installeret.

REM --- Start med PM2 ---
echo.
set /p APP_FILE="Navn paa din app fil (fx app.js eller server.js): "
set /p APP_NAME="Navn til PM2 processen (fx mit-site): "

call pm2 start "%APP_FILE%" --name "%APP_NAME%"
call pm2 save
call pm2 startup

echo.
echo ====================================
echo  SETUP FAERDIG!
echo ====================================
echo.
echo Din app koerer nu med PM2.
echo.
echo Naeste skridt:
echo 1. Aktiver proxy moduler i XAMPP (httpd.conf)
echo 2. Opsaet VirtualHost (httpd-vhosts.conf)
echo 3. Peg dit domaene til VPS IP
echo 4. Opsaet SSL via Cloudflare
echo.
echo Kør "pm2 list" for at se status.
echo.
pause
