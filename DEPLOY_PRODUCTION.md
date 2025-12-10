# 🚀 Guía de Despliegue en Producción

## Información del Servidor

- **Dominio**: `dilus.mchdev.es`
- **Servidor**: Ubuntu con Docker y Nginx
- **Puertos asignados**:
  - Frontend: `8081` (interno)
  - Backend: `3003` (interno)
  - PostgreSQL: `5435` (interno)

---

## 📋 Pasos de Despliegue

### 1. Preparar el Servidor

```bash
# Conectar al servidor
ssh usuario@tu-servidor

# Crear directorio para la aplicación
mkdir -p /opt/quiz-roulette
cd /opt/quiz-roulette
```

### 2. Subir los Archivos

Desde tu máquina local, sube el proyecto:

```bash
# Opción A: Git clone (si tienes repositorio)
git clone https://tu-repositorio.git /opt/quiz-roulette

# Opción B: rsync/scp
rsync -avz --exclude 'node_modules' --exclude '.git' \
  D:/GitHub/roulette/ usuario@servidor:/opt/quiz-roulette/
```

### 3. Configurar Variables de Entorno

```bash
cd /opt/quiz-roulette

# Copiar archivo de configuración
cp .env.production .env

# Editar con contraseñas seguras
nano .env
```

**⚠️ IMPORTANTE**: Cambia estos valores en `.env`:
- `POSTGRES_PASSWORD`: Contraseña segura para la base de datos
- `ADMIN_TOKEN`: Token largo y aleatorio para el panel admin

Ejemplo de generación de token seguro:
```bash
openssl rand -hex 32
```

### 4. Configurar Nginx del Servidor

```bash
# Copiar configuración de nginx
sudo cp /opt/quiz-roulette/ngixmchdev/sites-available/dilus.mchdev.es \
        /etc/nginx/sites-available/

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/dilus.mchdev.es \
           /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Si todo está bien, recargar nginx
sudo systemctl reload nginx
```

### 5. Construir y Lanzar los Contenedores

```bash
cd /opt/quiz-roulette

# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Levantar contenedores
docker-compose -f docker-compose.prod.yml up -d

# Verificar que están corriendo
docker-compose -f docker-compose.prod.yml ps
```

### 6. Verificar el Despliegue

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Verificar health del backend
curl http://localhost:3003/health

# Verificar frontend
curl http://localhost:8081
```

Luego visita: **https://dilus.mchdev.es**

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Reiniciar servicios
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Detener todo
```bash
docker-compose -f docker-compose.prod.yml down
```

### Reconstruir después de cambios
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Re-ejecutar seed (cargar preguntas/premios)
```bash
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### Ver estado de contenedores
```bash
docker ps | grep quiz
```

---

## 📝 Estructura de Puertos

| Servicio | Puerto Interno | Puerto Externo | URL |
|----------|---------------|----------------|-----|
| Frontend | 80 | 8081 | http://127.0.0.1:8081 |
| Backend | 3000 | 3003 | http://127.0.0.1:3003 |
| PostgreSQL | 5432 | 5435 | localhost:5435 |

El nginx del servidor (`dilus.mchdev.es`) rutea:
- `/` → Frontend (8081)
- `/api/*` → Backend (3003)
- `/ws` → Backend WebSocket (3003)

---

## 🔒 Seguridad

1. **Cambiar contraseñas por defecto** en `.env`
2. **No exponer PostgreSQL** a internet (solo puerto interno)
3. **Usar HTTPS** (ya configurado en nginx)
4. **Token Admin** debe ser largo y aleatorio

---

## 🐛 Solución de Problemas

### Error: Puerto ya en uso
```bash
# Ver qué usa el puerto
lsof -i :3003
# o
netstat -tulpn | grep 3003
```

### Error: No se conecta WebSocket
- Verificar que nginx tiene configurado el proxy WebSocket
- Revisar logs: `docker-compose -f docker-compose.prod.yml logs backend`

### Error: CORS
- Verificar que el dominio está en la lista de CORS del backend
- Revisar: `backend/src/server.js` - array `allowedOrigins`

### Base de datos vacía
```bash
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

---

## 📱 URLs de Acceso

- **Panel Admin**: https://dilus.mchdev.es/admin
- **Unirse a Juego**: https://dilus.mchdev.es/join/{CODIGO}
- **Health Check**: https://dilus.mchdev.es/health

