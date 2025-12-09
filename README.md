# 🎮 Quiz Corporativo con Premios - Grupo Dilus

Sistema completo de juego tipo trivial corporativo en tiempo real con sorteo de premios mediante ruleta virtual.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Flujo del Juego](#flujo-del-juego)
- [Despliegue](#despliegue)
- [Troubleshooting](#troubleshooting)

## ✨ Características

### Para Jugadores (Móvil)
- ✅ Unirse al juego mediante código QR o enlace
- ✅ Responder preguntas en tiempo real (5 segundos por pregunta)
- ✅ Ver resultados y premios ganados
- ✅ Interfaz optimizada para móviles
- ✅ Conexión en tiempo real vía WebSockets

### Para Administradores
- ✅ Crear y gestionar juegos
- ✅ Generar códigos QR automáticamente
- ✅ Ver lista de jugadores en tiempo real
- ✅ Controlar rondas de preguntas
- ✅ Sistema de ruleta para sorteo de premios
- ✅ Panel estadístico completo
- ✅ Gestión de premios con prioridades

### Sistema
- ✅ Backend con Node.js + Express
- ✅ Base de datos PostgreSQL (sin ORM)
- ✅ Frontend React + Vite
- ✅ WebSockets nativos (biblioteca `ws`)
- ✅ 84 preguntas corporativas incluidas
- ✅ Sistema de premios por prioridad

## 🛠️ Tecnologías

### Backend
- **Node.js** (v18+)
- **Express** - Framework web
- **PostgreSQL** - Base de datos
- **ws** - WebSockets nativos
- **uuid** - Generación de IDs únicos

### Frontend
- **React** (v18+)
- **Vite** - Build tool
- **React Router** - Enrutamiento
- **qrcode.react** - Generación de códigos QR

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **npm** o **yarn**
- **Git**

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd roulette
```

### 2. Instalar dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del Frontend

```bash
cd ../frontend
npm install
```

### 4. Configurar PostgreSQL

Crear la base de datos:

```bash
psql -U postgres
CREATE DATABASE quiz_db;
\q
```

### 5. Configurar variables de entorno

**Backend** (`backend/.env`):

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quiz_db
ADMIN_TOKEN=admin_secret_token_change_in_production
NODE_ENV=development
```

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_ADMIN_TOKEN=admin_secret_token_change_in_production
```

### 6. Ejecutar migraciones y seed

```bash
cd backend
npm run migrate
npm run seed
```

## ⚙️ Configuración

### Premios

Los premios se configuran en el seed (`backend/src/models/seed.js`):

```javascript
const prizes = [
  { name: 'Lote Navideño Premium', type: 'lote', remaining_units: 5, priority: 1 },
  { name: 'Lote Navideño Estándar', type: 'lote', remaining_units: 10, priority: 2 },
  // ...
];
```

**Nota**: La `priority` determina qué premio se da primero (menor = mejor).

### Preguntas

Las preguntas están en `questions/test_questions.json`. Formato:

```json
{
  "id": 1,
  "question": "Texto de la pregunta",
  "answers": [
    { "text": "Opción A", "correct": false },
    { "text": "Opción B", "correct": false },
    { "text": "Opción C", "correct": true },
    { "text": "Opción D", "correct": false }
  ]
}
```

## 🎮 Uso

### Desarrollo

#### 1. Iniciar el Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

#### 2. Iniciar el Frontend

```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Producción

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## 📁 Estructura del Proyecto

```
roulette/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin.js          # Rutas de administración
│   │   │   └── game.js           # Rutas del juego
│   │   ├── services/
│   │   │   ├── gameService.js    # Lógica del juego
│   │   │   ├── prizeService.js   # Gestión de premios
│   │   │   └── questionService.js # Gestión de preguntas
│   │   ├── models/
│   │   │   ├── schema.sql        # Esquema de BD
│   │   │   ├── migrate.js        # Script de migración
│   │   │   └── seed.js           # Datos iniciales
│   │   ├── db.js                 # Configuración PostgreSQL
│   │   ├── websocket.js          # Servidor WebSocket
│   │   └── server.js             # Servidor principal
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx # Panel crear juego
│   │   │   └── AdminGame.jsx      # Panel control juego
│   │   ├── player/
│   │   │   ├── PlayerJoin.jsx     # Unirse al juego
│   │   │   └── PlayerGame.jsx     # Pantalla jugador
│   │   ├── components/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── Logo.jsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js
│   │   │   └── useCountdown.js
│   │   ├── services/
│   │   │   └── api.js             # Cliente API
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── questions/
│   └── test_questions.json        # 84 preguntas
├── assets/
│   └── logo.svg                   # Logo corporativo
└── README.md
```

## 🎯 Flujo del Juego

### 1. Preparación (Administrador)

1. Acceder a `/admin`
2. Configurar número de preguntas por ronda (1-10)
3. Hacer clic en "Crear Juego"
4. Se genera un código QR único

### 2. Registro de Jugadores

1. Los jugadores escanean el QR con su móvil
2. Ingresan su nombre
3. Esperan en sala hasta que el admin inicie

### 3. Durante el Juego

#### Por cada ronda:

1. **Admin** inicia el juego
2. Se muestran N preguntas (configurado previamente)
3. Cada pregunta tiene **5 segundos** para responder
4. Los jugadores seleccionan sus respuestas en el móvil
5. Al finalizar la ronda:
   - Se calculan los ganadores (quienes acertaron TODAS)
   - **Admin** ejecuta la ruleta
   - Se selecciona un ganador aleatorio de los acertantes
   - Se asigna el **mejor premio disponible** (menor priority)
   - El ganador queda eliminado del pool de jugadores

6. Se repite hasta que:
   - No queden premios, **o**
   - Todos los jugadores hayan ganado

### 4. Finalización

- Se muestra pantalla de resultados finales
- Todos los jugadores ven su premio (si ganaron)

## 🐳 Despliegue

### Docker Compose (Recomendado)

#### 1. Crear archivo `docker-compose.yml` en la raíz:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: quiz_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/quiz_db
      ADMIN_TOKEN: ${ADMIN_TOKEN:-admin_secret_token}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    command: sh -c "npm run migrate && npm run seed && npm start"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 2. Crear `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### 3. Crear `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 4. Crear `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. Ejecutar:

```bash
docker-compose up -d
```

Acceder a:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

## 🔧 Troubleshooting

### La base de datos no se conecta

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -h localhost -d quiz_db
```

### Error en WebSocket

- Verificar que el puerto 3000 no esté bloqueado por firewall
- Comprobar que VITE_WS_URL esté correctamente configurado
- Revisar consola del navegador para errores de conexión

### Las preguntas no se cargan

```bash
# Re-ejecutar el seed
cd backend
npm run seed
```

### Error "No hay preguntas disponibles"

Las preguntas marcadas como `used_in_game = true` no se reutilizan. Para resetear:

```sql
UPDATE questions SET used_in_game = FALSE;
```

### Frontend no encuentra el logo

Copiar el logo a:
```bash
cp assets/logo.svg frontend/public/assets/logo.svg
```

## 📞 Soporte

Para problemas o consultas:
- **Grupo Dilus**: www.grupodilus.com
- **GitHub Issues**: <repository-url>/issues

## 📄 Licencia

© 2024 Grupo Dilus. Todos los derechos reservados.

---

**Desarrollado con ❤️ para Grupo Dilus**



