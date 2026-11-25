# Despliegue de Nova CRM en Raspberry Pi

Guía para publicar el CRM completo (interfaz + API + Prospector Facebook) en una
Raspberry Pi con un dominio propio. **Un solo proceso de Node sirve el frontend
compilado y la API**, así la Pi consume menos memoria y no hay que pelear con CORS.

---

## 1. Requisitos en la Raspberry Pi

| Componente | Versión sugerida | Notas |
| --- | --- | --- |
| Raspberry Pi OS 64-bit | Bookworm | 64 bits es obligatorio para Node moderno |
| Node.js | 20 LTS o 22 | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash -` |
| MongoDB | 6 o 7 | Base local del Prospector y de los módulos dinámicos |
| Caddy o Nginx | última | Reverse proxy + HTTPS automático |
| Swap | 1–2 GB | Recomendado en modelos de 2 GB de RAM |

```bash
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo apt install -y mongodb-org   # o el paquete de tu distro
sudo systemctl enable --now mongod
```

---

## 2. Instalar el proyecto

```bash
cd /opt
sudo git clone <URL_DEL_REPO> nova-crm
sudo chown -R $USER:$USER /opt/nova-crm
cd /opt/nova-crm

# Dependencias (una sola vez)
npm --prefix server install
npm --prefix client install
```

### Variables de entorno

`server/.env` (mínimo indispensable):

```env
PORT=5001
DB_URL=mongodb://127.0.0.1:27017
DB=Prolink

# Supabase del CRM
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
JWT_SECRET=<cadena_larga_y_aleatoria>

# Prospector Facebook (también se pueden cargar desde la interfaz)
APIFY_TOKEN=apify_api_...
GEMINI_API_KEY=AIza...
```

`client/.env.production` ya viene configurado con `REACT_APP_BASE_URL=/`
(sirve para que el build hable con la API del mismo dominio).

---

## 3. Compilar y levantar

```bash
cd /opt/nova-crm
npm run build      # genera client/build
npm run serve      # Express en el puerto 5001 (API + interfaz)
```

Verifica en la Pi:

```bash
curl -I http://127.0.0.1:5001/          # 200 + HTML del CRM
curl -s http://127.0.0.1:5001/api | head # API viva
```

---

## 4. Servicio systemd (arranque automático)

`/etc/systemd/system/nova-crm.service`:

```ini
[Unit]
Description=Nova CRM (Express + React)
After=network.target mongod.service

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/nova-crm/server
Environment=NODE_ENV=production
Environment=PORT=5001
# Ajusta la memoria si la Pi tiene 2 GB:
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nova-crm
sudo systemctl status nova-crm
journalctl -u nova-crm -f
```

> Cada vez que actualices el código: `git pull && npm --prefix client install && npm run build && sudo systemctl restart nova-crm`.

---

## 5. Dominio y HTTPS con Caddy (recomendado)

`/etc/caddy/Caddyfile`:

```caddy
midominio.com, www.midominio.com {
    encode gzip zstd
    reverse_proxy 127.0.0.1:5001
}
```

```bash
sudo systemctl reload caddy
```

Caddy emite y renueva el certificado TLS automáticamente. En el DNS del dominio
apunta un registro `A` (y `AAAA` si tienes IPv6) a la IP pública de la Pi; abre
los puertos 80 y 443 en el router.

Si prefieres Nginx:

```nginx
server {
    server_name midominio.com;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Prospector Facebook en la Pi

1. Entra al CRM con un usuario administrador.
2. Menú **Prospector FB → Ajustes**.
3. Pega el **token de Apify** (apify.com → Settings → Integrations) y, si quieres
   usar IA, la **llave de Google Gemini**. Guarda y pulsa *Verificar conexiones*.
4. En **Grupos** revisa los sectores precargados (Tec, San Pedro, UDEM, Monterrey)
   y ajusta tus grupos.
5. Pulsa **Nueva extracción** y sigue el avance en **Actividad**.

Notas de consumo en la Pi:

- El scraping corre **en la nube de Apify**; la Pi solo descarga el resultado.
- Las extracciones se ejecutan en segundo plano (jobs), así que cerrar el
  navegador no las cancela y la API no se bloquea.
- Todo lo descargado se guarda en MongoDB local (`FacebookLeads`), por lo que el
  módulo sigue funcionando aunque Apify o Supabase estén caídos.
- Los prospectos se pueden enviar al módulo **Leads** (Supabase) con un clic.

---

## 7. Acceso de los empleados

El módulo se agrega automáticamente al menú de todos los roles existentes con
permiso de **ver**. Para ajustarlo:

1. **Roles** → selecciona el rol del empleado (ej. *Sales* o *Empleado*).
2. Activa o desactiva la fila **Prospector FB** (ver / crear / editar / eliminar).
3. Si quieres ocultar el módulo por completo, usa **Active Deactive Module**.

---

## 8. Diagnóstico rápido

| Síntoma | Revisar |
| --- | --- |
| Página en blanco | `npm run build` reciente y `journalctl -u nova-crm` |
| “Sin token de Apify” | Ajustes del módulo o `APIFY_TOKEN` en `server/.env` |
| Error 521 de Supabase | Proyecto pausado en supabase.com → *Restore project* |
| La Pi se queda sin memoria | `NODE_OPTIONS=--max-old-space-size=512`, swap 2 GB, subir a Pi 4/5 con 4 GB |
| No carga el CSS del portal público | El portal usa Tailwind por CDN; requiere salida a internet |
