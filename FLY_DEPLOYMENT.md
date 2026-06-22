# Fly.io Deployment

This project is ready to run as one small Fly.io Node app.

## Recommended Settings

- Internal port: `8080`
- Machine size: `shared-cpu-1x`
- Memory: `256mb`
- Public HTTPS: enabled by Fly through `force_https = true`
- Minimum running machines: `1`

Keeping one machine running avoids losing active in-memory games while people are playing.

## Environment Variables

These are already set in `fly.toml`:

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=8080
BATTLECHESS_DATA_DIR=/tmp/battlechess-armada
```

The current game keeps lobby/game/chat state in memory, so no database is required yet.

To enable the private admin lobby watcher and bug-report viewer, add your exact login username:

```powershell
fly secrets set BATTLECHESS_ADMIN_USERS=BCAadminCrusibal
```

By default, the server only allows `BCAadminCrusibal` as an admin username. Multiple admin usernames can be comma-separated if you intentionally add more later.

## First-Time Deploy

Install and log in to Fly, then run from this project folder:

```powershell
fly auth login
fly launch --no-deploy
```

If Fly asks whether to overwrite `fly.toml`, say no. If `battlechess-armada` is unavailable, choose a different app name and update the `app =` value in `fly.toml`.

Then deploy:

```powershell
fly deploy
```

Open the app:

```powershell
fly open
```

## Useful Commands

```powershell
fly status
fly logs
fly checks list
```

## Notes

If the app restarts, active lobbies reset because the current implementation uses in-memory state. That is fine for the current prototype. Later, saved games or reconnect-proof games should use SQLite on a Fly volume or a small managed database.
