# Instrucciones de Despliegue - Quiz Corporativo

## 📋 Opciones de Despliegue

### Opción 1: Docker Compose (Recomendado)

La forma más sencilla de desplegar la aplicación completa.

#### Pre-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+

#### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd roulette
   ```

2. **Configurar variables de entorno**
   
   Crear archivo `.env` en la raíz:
   ```env
   ADMIN_TOKEN=tu_token_secreto_super_seguro
   ```

3. **Construir e iniciar los servicios**
   ```bash
   docker-compose up -d --build
   ```

4. **Verificar que todo esté funcionando**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

5. **Acceder a la aplicación**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432

#### Comandos útiles

```bash
# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart backend

# Ver estado
docker-compose ps

# Limpiar todo (incluyendo volúmenes)
docker-compose down -v
```

---

### Opción 2: Despliegue Manual

Para entornos sin Docker o configuraciones personalizadas.

#### Backend

1. **Instalar PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   brew services start postgresql
   ```

2. **Crear base de datos**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE quiz_db;
   CREATE USER quiz_user WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE quiz_db TO quiz_user;
   \q
   ```

3. **Configurar backend**
   ```bash
   cd backend
   npm install
   
   # Crear .env
   cat > .env << EOL
   PORT=3000
   DATABASE_URL=postgresql://quiz_user:secure_password@localhost:5432/quiz_db
   ADMIN_TOKEN=tu_token_secreto
   NODE_ENV=production
   EOL
   
   # Ejecutar migraciones
   npm run migrate
   npm run seed
   ```

4. **Iniciar backend con PM2 (recomendado para producción)**
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name quiz-backend
   pm2 save
   pm2 startup
   ```

#### Frontend

1. **Configurar y construir**
   ```bash
   cd frontend
   npm install
   
   # Crear .env
   cat > .env << EOL
   VITE_API_URL=http://tu-dominio.com:3000
   VITE_WS_URL=ws://tu-dominio.com:3000
   VITE_ADMIN_TOKEN=tu_token_secreto
   EOL
   
   # Build
   npm run build
   ```

2. **Servir con Nginx**
   
   Crear `/etc/nginx/sites-available/quiz`:
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;
       
       root /var/www/quiz/frontend/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/quiz /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### Opción 3: Despliegue en la Nube

#### AWS (EC2 + RDS)

1. **Crear instancia EC2**
   - AMI: Ubuntu Server 22.04 LTS
   - Tipo: t3.small (o superior)
   - Security Group: Puertos 80, 443, 3000, 22

2. **Crear base de datos RDS**
   - Engine: PostgreSQL 15
   - Clase: db.t3.micro (para desarrollo)
   - Acceso público: No
   - VPC: Misma que EC2

3. **Configurar en EC2**
   ```bash
   # Conectar por SSH
   ssh -i key.pem ubuntu@ec2-xxx-xxx-xxx-xxx.compute.amazonaws.com
   
   # Instalar Docker
   sudo apt update
   sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker ubuntu
   
   # Clonar y desplegar
   git clone <repository-url>
   cd roulette
   
   # Editar docker-compose.yml para usar RDS
   # DATABASE_URL: postgresql://user:pass@rds-endpoint:5432/quiz_db
   
   docker-compose up -d
   ```

4. **Configurar dominio y SSL**
   - Usar Route 53 para DNS
   - Instalar Certbot para SSL:
     ```bash
     sudo apt install certbot python3-certbot-nginx
     sudo certbot --nginx -d tu-dominio.com
     ```

#### Heroku

1. **Backend**
   ```bash
   cd backend
   heroku create quiz-backend
   heroku addons:create heroku-postgresql:mini
   heroku config:set ADMIN_TOKEN=tu_token_secreto
   git push heroku main
   heroku run npm run migrate
   heroku run npm run seed
   ```

2. **Frontend**
   ```bash
   cd frontend
   heroku create quiz-frontend
   heroku buildpacks:set heroku/nodejs
   heroku buildpacks:add heroku-community/nginx
   git push heroku main
   ```

#### DigitalOcean (Droplet + App Platform)

1. **Crear Droplet**
   - Ubuntu 22.04
   - 2 GB RAM / 1 CPU (mínimo)

2. **Instalar Docker y desplegar**
   ```bash
   # Instalar Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Clonar y ejecutar
   git clone <repository-url>
   cd roulette
   docker-compose up -d
   ```

---

## 🔒 Seguridad para Producción

### 1. Variables de entorno

**NUNCA** usar valores por defecto en producción:

```env
# ❌ MAL
ADMIN_TOKEN=admin_secret_token_change_in_production

# ✅ BIEN
ADMIN_TOKEN=$(openssl rand -hex 32)
```

### 2. PostgreSQL

```bash
# Cambiar contraseña por defecto
ALTER USER postgres WITH PASSWORD 'contraseña_super_segura';

# Limitar conexiones
# En postgresql.conf:
listen_addresses = 'localhost'
max_connections = 50
```

### 3. Firewall

```bash
# Ubuntu/Debian - UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. SSL/HTTPS

Usar Certbot para SSL gratuito:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### 5. Rate Limiting

Agregar a Nginx:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    # ... resto de configuración
}
```

---

## 📊 Monitoreo

### Logs

```bash
# Backend logs (PM2)
pm2 logs quiz-backend

# Docker logs
docker-compose logs -f backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Métricas con PM2

```bash
pm2 install pm2-logrotate
pm2 monit
```

---

## 🔄 Actualización

### Con Docker

```bash
cd roulette
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

### Manual

```bash
# Backend
cd backend
git pull
npm install
pm2 restart quiz-backend

# Frontend
cd frontend
git pull
npm install
npm run build
sudo systemctl reload nginx
```

---

## 🆘 Troubleshooting Despliegue

### Error: "Cannot connect to database"

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres
# o
sudo systemctl status postgresql

# Verificar conexión
psql -h localhost -U postgres -d quiz_db
```

### Error: "WebSocket connection failed"

- Verificar que el firewall permita el puerto 3000
- Comprobar configuración de proxy en Nginx
- Revisar CORS en backend

### Error: "Frontend muestra página en blanco"

```bash
# Verificar build
cd frontend
npm run build
ls -la dist/

# Verificar logs de Nginx
tail -f /var/log/nginx/error.log
```

### Performance lento

```bash
# Aumentar recursos de Docker
# En docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## 📞 Soporte

Para problemas de despliegue:
- Revisar logs: `docker-compose logs -f`
- GitHub Issues: <repository-url>/issues
- Email: soporte@grupodilus.com



