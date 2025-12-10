# =====================================================
# Script de Despliegue - Quiz Roulette
# =====================================================
# Ejecutar desde PowerShell en Windows:
#   .\deploy.ps1
# =====================================================

$SERVER_IP = Read-Host "Introduce la IP del servidor (ej: 192.168.1.100)"
$SERVER_USER = "root"
$SERVER_PASS = "qBZ96NtW"
$REMOTE_PATH = "/home/roulette"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Desplegando Quiz Roulette" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Servidor: $SERVER_USER@$SERVER_IP"
Write-Host "Ruta: $REMOTE_PATH"
Write-Host ""

# Verificar que scp está disponible
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: scp no encontrado. Instala OpenSSH o usa Git Bash" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Subiendo archivos al servidor..." -ForegroundColor Yellow

# Crear lista de archivos a subir (excluyendo node_modules, .git, etc)
$excludes = @(
    "node_modules",
    ".git",
    "*.log",
    ".env.local"
)

# Usar scp para subir
scp -r `
    backend `
    frontend `
    questions `
    ngixmchdev `
    docker-compose.prod.yml `
    .env.production `
    DEPLOY_PRODUCTION.md `
    "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"

Write-Host ""
Write-Host "[2/4] Archivos subidos correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ahora ejecuta estos comandos en el servidor:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ssh root@$SERVER_IP" -ForegroundColor White
Write-Host ""

