# Configuración nginx para dilus.mchdev.es (Quiz/Roulette App)
# 
# Este archivo debe copiarse a /etc/nginx/sites-available/ 
# y crear enlace simbólico en sites-enabled:
#   sudo ln -s /etc/nginx/sites-available/dilus.mchdev.es /etc/nginx/sites-enabled/
#   sudo nginx -t && sudo systemctl reload nginx

# Mapa para upgrade de conexiones WebSocket
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# Servidor HTTPS principal
server {
    listen 443 ssl;
    server_name dilus.mchdev.es;

    # Certificados SSL (mismos que otros subdominios mchdev.es)
    ssl_certificate     /etc/ssl/mchdev/fullchain.pem;
    ssl_certificate_key /etc/ssl/mchdev/tu-dominio.key;

    # Configuración SSL recomendada
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # WebSocket - Conexión al backend (puerto 3003)
    location /ws {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts largos para WebSocket
        proxy_read_timeout 86400;
        proxy_connect_timeout 75s;
        proxy_send_timeout 86400;
    }

    # API - Conexión al backend (puerto 3003)
    location /api/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check del backend
    location /health {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend - Conexión al contenedor frontend (puerto 8081)
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/dilus.mchdev.es.access.log;
    error_log /var/log/nginx/dilus.mchdev.es.error.log;
}

# Redirección HTTP -> HTTPS
server {
    listen 80;
    server_name dilus.mchdev.es;
    return 301 https://$host$request_uri;
}

