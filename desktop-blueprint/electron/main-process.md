# Electron Main Process Blueprint

The production desktop app should move browser-only responsibilities into Electron:

- `main.ts`: app lifecycle, window creation, app protocol, updater bootstrap
- `preload.ts`: typed IPC bridge for settings, database, AI calls and license checks
- `security.ts`: CSP, navigation guards, permission guards, disabled remote module
- `db.ts`: SQLite connection, migrations and repository wiring
- `secureSettings.ts`: OS keychain access for API keys and encrypted values

Renderer code should never access Node APIs directly. All privileged work goes through a narrow preload API.

Recommended IPC channels:

- `settings:get`
- `settings:set`
- `secureSettings:getApiKey`
- `secureSettings:setApiKey`
- `mailResponses:create`
- `mailResponses:list`
- `templates:create`
- `templates:list`
- `license:verify`
- `ai:generateMailResponse`
