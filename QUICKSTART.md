# 🚀 Inicio Rápido - Quiz Corporativo

## Pasos para empezar en 5 minutos

### 1️⃣ Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

### 2️⃣ Configurar PostgreSQL

```bash
# Crear base de datos
psql -U postgres
CREATE DATABASE quiz_db;
\q
```

### 3️⃣ Ejecutar migraciones y seed

```bash
cd backend
npm run migrate
npm run seed
```

### 4️⃣ Iniciar servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5️⃣ ¡Listo! 🎉

- **Admin**: http://localhost:5173/admin
- **Backend API**: http://localhost:3000
- **WebSocket**: ws://localhost:3000

---

## 🎮 Cómo usar

1. Abre http://localhost:5173/admin
2. Haz clic en "Crear Juego"
3. Escanea el QR con tu móvil (o copia la URL)
4. Ingresa tu nombre en el móvil
5. Desde el admin, haz clic en "Iniciar Juego"
6. ¡Juega y gana premios!

---

## 🐛 Problemas comunes

### Error: "Cannot connect to database"

```bash
# Verificar que PostgreSQL esté corriendo
# Windows (PowerShell como admin):
Get-Service -Name postgresql*

# Iniciar PostgreSQL si no está corriendo
Start-Service postgresql-x64-14
```

### Error: "Port 3000 already in use"

```bash
# Windows (PowerShell como admin):
netstat -ano | findstr :3000
# Luego matar el proceso:
taskkill /PID <PID> /F
```

### Error: "No hay preguntas disponibles"

```bash
cd backend
npm run seed
```

---

## 📱 Probar en el móvil

1. Asegúrate de que tu móvil esté en la misma red WiFi que tu PC
2. Busca tu IP local:
   ```bash
   # Windows (PowerShell):
   ipconfig
   # Buscar "IPv4 Address"
   ```
3. Modifica `frontend/.env`:
   ```env
   VITE_API_URL=http://TU_IP:3000
   VITE_WS_URL=ws://TU_IP:3000
   ```
4. Reinicia el frontend
5. Accede desde el móvil a: `http://TU_IP:5173`

---

## 🐳 Inicio con Docker (alternativa)

```bash
# Una sola vez, desde la raíz del proyecto:
docker-compose up -d

# Acceder a:
# - Frontend: http://localhost
# - Backend: http://localhost:3000
```

---

## 📚 Documentación completa

- **README.md** - Documentación completa
- **DEPLOYMENT.md** - Guía de despliegue en producción

---

## 🆘 Ayuda

¿Problemas? Revisa:
1. Los logs en la terminal
2. La consola del navegador (F12)
3. README.md para más detalles

**¡Diviértete jugando!** 🎉



