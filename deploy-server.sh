#!/bin/bash
# =====================================================
# Script de Configuración en Servidor - Quiz Roulette
# =====================================================
# Ejecutar EN EL SERVIDOR como root:
#   cd /home/roulette && chmod +x deploy-server.sh && ./deploy-server.sh
# =====================================================

set -e

echo ""
echo "========================================"
echo "  Configurando Quiz Roulette"
echo "========================================"
echo ""

ROULETTE_PATH="/home/roulette"
cd $ROULETTE_PATH

# 1. Configurar variables de entorno
echo "[1/5] Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp .env.production .env
    # Generar contraseñas seguras
    POSTGRES_PASS=$(openssl rand -hex 16)
    ADMIN_TOKEN=$(openssl rand -hex 32)
    
    sed -i "s/CAMBIAR_POR_PASSWORD_SEGURA/$POSTGRES_PASS/g" .env
    sed -i "s/CAMBIAR_POR_TOKEN_SEGURO_Y_LARGO/$ADMIN_TOKEN/g" .env
    
    echo "  ✅ Archivo .env creado con contraseñas seguras"
    echo ""
    echo "  ⚠️  GUARDA ESTE TOKEN ADMIN: $ADMIN_TOKEN"
    echo ""
else
    echo "  ⚠️  Archivo .env ya existe, no se modifica"
fi

# 2. Configurar nginx
echo "[2/5] Configurando Nginx..."
cp $ROULETTE_PATH/ngixmchdev/sites-available/dilus.mchdev.es /etc/nginx/sites-available/

# Crear enlace si no existe
if [ ! -L /etc/nginx/sites-enabled/dilus.mchdev.es ]; then
    ln -s /etc/nginx/sites-available/dilus.mchdev.es /etc/nginx/sites-enabled/
fi

# Verificar configuración nginx
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "  ✅ Nginx configurado y recargado"
else
    echo "  ❌ Error en configuración de Nginx"
    exit 1
fi

# 3. Construir imágenes Docker
echo "[3/5] Construyendo imágenes Docker (esto puede tardar)..."
docker-compose -f docker-compose.prod.yml build

# 4. Levantar contenedores
echo "[4/5] Levantando contenedores..."
docker-compose -f docker-compose.prod.yml up -d

# 5. Esperar y verificar
echo "[5/5] Verificando despliegue..."
sleep 10

# Verificar que los contenedores están corriendo
if docker ps | grep -q quiz_backend; then
    echo "  ✅ Backend corriendo"
else
    echo "  ❌ Backend no está corriendo"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

if docker ps | grep -q quiz_frontend; then
    echo "  ✅ Frontend corriendo"
else
    echo "  ❌ Frontend no está corriendo"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

if docker ps | grep -q quiz_postgres; then
    echo "  ✅ PostgreSQL corriendo"
else
    echo "  ❌ PostgreSQL no está corriendo"
    exit 1
fi

# Verificar health del backend
sleep 5
HEALTH=$(curl -s http://localhost:3003/health || echo "error")
if echo $HEALTH | grep -q "ok"; then
    echo "  ✅ Backend respondiendo correctamente"
else
    echo "  ⚠️  Backend aún iniciando, espera unos segundos..."
fi

echo ""
echo "========================================"
echo "  ✅ DESPLIEGUE COMPLETADO"
echo "========================================"
echo ""
echo "  🌐 URL: https://dilus.mchdev.es"
echo "  🔧 Admin: https://dilus.mchdev.es/admin"
echo ""
echo "  Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""

