# Technical architecture

## Current repository

- `index.html`, `styles.css`: browser interface.
- `game.js`: Three.js scene, input, local player, and WebSocket client.
- `config.js`: public client configuration.
- `server.js`: small Node.js WebSocket server.
- `package.json`: backend dependencies and start command.
- `.github/workflows/pages.yml`: static GitHub Pages deployment.

## Target architecture

```text
Phone / desktop browser
        |
        | HTTPS (static client)
        v
   GitHub Pages
        |
        | WSS (multiplayer connection)
        v
 Node.js API + WebSocket gateway
        |
        +---- Authentication/session service
        +---- Room/lobby service
        +---- Presence and chat
        +---- Persistence (database)
        +---- Moderation/reporting
        |
        v
 Database + backups
```

## Hosting split

GitHub Pages can serve the browser client, but it cannot host `server.js`. Deploy the Node service separately and set `window.REC_BROWSER_SERVER` in `config.js` to its `wss://` address. Never put passwords, private API keys, database credentials, or signing secrets in `config.js`; browser files are public.

## Network protocol direction

The current prototype sends position updates. Before adding accounts or public rooms, the protocol should gain:
- A version field on every message.
- Server-assigned player IDs.
- Input validation and rate limits.
- Room-scoped broadcasts.
- Server-side movement bounds and update throttling.
- Explicit error and reconnect messages.

Do not treat client-supplied names, IDs, positions, or permissions as trusted.

## Compatibility boundary

An independent browser game and a server reimplementation are separate components. A community server project does not automatically provide a browser client, original game assets, or a compatible client build. Any future adapter must use documented/authorized interfaces and must not defeat DRM, anti-cheat, or access controls.
