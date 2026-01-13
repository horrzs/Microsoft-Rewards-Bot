# Docker

## What it does
Runs the bot in a container with bundled scheduling and browser setup.

## How to use
- Ensure `src/accounts.jsonc` and `src/config.jsonc` are present before starting.
- Run `npm run docker:compose` to build and start the container.
- View logs with `docker logs -f microsoft-rewards-bot` or the compose service name.

## Dashboard (host-only access)
To expose the dashboard while keeping it accessible only from the host machine:

1. Set the dashboard to listen on all interfaces **inside** the container:
   ```jsonc
   "dashboard": {
     "enabled": true,
     "port": 3000,
     "host": "0.0.0.0"
   }
   ```
2. Bind the published port to localhost **on the host**:
   ```yaml
   ports:
     - "127.0.0.1:3000:3000"
   ```
This keeps the API/UI reachable at `http://127.0.0.1:3000` on the host, while blocking LAN access.

## Dashboard (always-on in Docker)
The compose setup runs cron as PID 1, so the dashboard only exists while a bot run is active unless you
start it as a separate background process. To keep it running:

1. Enable the standalone dashboard process:
   ```yaml
   environment:
     START_DASHBOARD: "true"
     DASHBOARD_HOST: "0.0.0.0"
     DASHBOARD_PORT: "3000"
   ```
2. Publish the port (host-only or LAN, depending on your needs):
   ```yaml
   ports:
     - "127.0.0.1:3000:3000"
   ```
The `DASHBOARD_HOST`/`DASHBOARD_PORT` values are required for the standalone dashboard process.

## Example
```bash
npm run docker:compose
```

---
**[← Back to Documentation](index.md)**
