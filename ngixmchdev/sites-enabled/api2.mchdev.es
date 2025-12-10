server {
    listen 443 ssl;
    server_name api2.mchdev.es;

    ssl_certificate     /etc/ssl/mchdev/fullchain.pem;
    ssl_certificate_key /etc/ssl/mchdev/tu-dominio.key;



    location / {
        proxy_pass http://127.0.0.1:4000;  # API 2 en puerto 4000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api2.mchdev.es;
    return 301 https://$host$request_uri;
}
