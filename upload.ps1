# =====================================================
# Script de subida - Quiz Roulette
# =====================================================
# Ejecutar: .\upload.ps1
# =====================================================

$SERVER = "root@93.93.112.161"
$REMOTE_PATH = "/home/roulette"

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Subiendo Quiz Roulette al servidor"     -ForegroundColor Cyan  
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""
Write-Host "Contrasena: qBZ96NtW" -ForegroundColor Yellow
Write-Host ""

# Primero crear estructura de carpetas en el servidor
Write-Host "[1/6] Creando estructura de carpetas..." -ForegroundColor Green
ssh $SERVER "mkdir -p $REMOTE_PATH/backend/src/models $REMOTE_PATH/backend/src/routes $REMOTE_PATH/backend/src/services $REMOTE_PATH/frontend/src/admin $REMOTE_PATH/frontend/src/components $REMOTE_PATH/frontend/src/hooks $REMOTE_PATH/frontend/src/player $REMOTE_PATH/frontend/src/services $REMOTE_PATH/frontend/public/assets $REMOTE_PATH/questions $REMOTE_PATH/ngixmchdev/sites-available $REMOTE_PATH/ngixmchdev/sites-enabled"

# Subir archivos raíz
Write-Host "[2/6] Subiendo archivos de configuracion..." -ForegroundColor Green
scp docker-compose.prod.yml .env.production deploy-server.sh DEPLOY_PRODUCTION.md "${SERVER}:${REMOTE_PATH}/"

# Subir backend completo
Write-Host "[3/6] Subiendo backend..." -ForegroundColor Green
scp backend/Dockerfile backend/package.json "${SERVER}:${REMOTE_PATH}/backend/"
scp backend/src/*.js "${SERVER}:${REMOTE_PATH}/backend/src/"
scp backend/src/models/* "${SERVER}:${REMOTE_PATH}/backend/src/models/"
scp backend/src/routes/* "${SERVER}:${REMOTE_PATH}/backend/src/routes/"
scp backend/src/services/* "${SERVER}:${REMOTE_PATH}/backend/src/services/"

# Subir frontend completo (sin node_modules)
Write-Host "[4/6] Subiendo frontend..." -ForegroundColor Green
scp frontend/Dockerfile frontend/Dockerfile.prod frontend/index.html frontend/nginx.conf frontend/nginx.prod.conf frontend/package.json frontend/package-lock.json frontend/vite.config.js "${SERVER}:${REMOTE_PATH}/frontend/"
scp frontend/src/*.jsx frontend/src/*.css "${SERVER}:${REMOTE_PATH}/frontend/src/"
scp frontend/src/admin/* "${SERVER}:${REMOTE_PATH}/frontend/src/admin/"
scp frontend/src/components/* "${SERVER}:${REMOTE_PATH}/frontend/src/components/"
scp frontend/src/hooks/* "${SERVER}:${REMOTE_PATH}/frontend/src/hooks/"
scp frontend/src/player/* "${SERVER}:${REMOTE_PATH}/frontend/src/player/"
scp frontend/src/services/* "${SERVER}:${REMOTE_PATH}/frontend/src/services/"
scp frontend/public/favicon.png "${SERVER}:${REMOTE_PATH}/frontend/public/"
scp frontend/public/assets/* "${SERVER}:${REMOTE_PATH}/frontend/public/assets/"

# Subir questions
Write-Host "[5/6] Subiendo preguntas y premios..." -ForegroundColor Green
scp questions/prizes.json questions/test_questions.json "${SERVER}:${REMOTE_PATH}/questions/"

# Subir nginx config
Write-Host "[6/6] Subiendo configuracion nginx..." -ForegroundColor Green
scp ngixmchdev/sites-available/* "${SERVER}:${REMOTE_PATH}/ngixmchdev/sites-available/"

Write-Host ""
Write-Host "========================================"  -ForegroundColor Green
Write-Host "  ✅ Subida completada!"                   -ForegroundColor Green
Write-Host "========================================"  -ForegroundColor Green
Write-Host ""
Write-Host "Ahora conectate al servidor y ejecuta:"   -ForegroundColor Yellow
Write-Host ""
Write-Host "  ssh root@93.93.112.161"                 -ForegroundColor White
Write-Host "  cd /home/roulette"                      -ForegroundColor White
Write-Host "  chmod +x deploy-server.sh"              -ForegroundColor White
Write-Host "  ./deploy-server.sh"                     -ForegroundColor White
Write-Host ""

