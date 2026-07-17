# Battlechess Armada Local Raspberry Pi Deployment

This prototype is designed to run as a small Node HTTP app behind NGINX on Raspberry Pi OS 64-bit Lite.

These instructions assume you copied all project files into:

```bash
/var/www/html
```

Players should access the game from another PC at:

```text
http://<raspberry-pi-ip>/
```

## Runtime

- Node.js 18+ is recommended.
- No npm packages are required.
- Player accounts are stored in `data/users.json` by default.
- Override the data location with `BATTLECHESS_DATA_DIR=/path/to/data`.
- Recommended: always use `BATTLECHESS_DATA_DIR=/var/lib/battlechess-armada` on the Raspberry Pi so account data is outside the web folder. The app and example NGINX config also block `/data`, but keeping private data out of `/var/www/html` is still the safer layout.

## Run Directly

```bash
cd /var/www/html
HOST=127.0.0.1 PORT=8080 node server.js
```

Use `HOST=127.0.0.1` when NGINX is reverse proxying to the app. You will still access the game from another device by visiting the Raspberry Pi's LAN IP on port 80, for example `http://192.168.1.50/`.

Use `HOST=0.0.0.0` only if you want Node exposed directly on the LAN on its own port, such as `http://192.168.1.50:8080/`. The recommended setup is NGINX on port 80 and Node private on `127.0.0.1:8080`.

## Example systemd Service

```ini
[Unit]
Description=Battlechess Armada
After=network.target

[Service]
WorkingDirectory=/opt/battlechess-armada
Environment=HOST=127.0.0.1
Environment=PORT=8080
Environment=BATTLECHESS_DATA_DIR=/var/lib/battlechess-armada
ExecStart=/usr/bin/node /var/www/html/server.js
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Create the data directory and make it writable by the service user:

```bash
sudo mkdir -p /var/lib/battlechess-armada
sudo chown www-data:www-data /var/lib/battlechess-armada
```

If you prefer to keep the `data/users.json` file directly inside `/var/www/html/data`, omit `BATTLECHESS_DATA_DIR`. The `/var/lib/battlechess-armada` location is cleaner for a service install.

## Example NGINX Site For Pi IP Access

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

With this config, browse to the Pi directly by IP:

```text
http://<raspberry-pi-ip>/
```

No `localhost` URL is required from player devices. `localhost` is used only internally by NGINX on the Raspberry Pi when forwarding requests to the Node app.

## Current Multiplayer Scope

The lobby, login, registration, and seat assignment are server-backed. The game board is now color-locked by the player seat and renders from that player viewpoint, but full server-authoritative game-state synchronization is the next milestone.
