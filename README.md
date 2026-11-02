# Rec-browser

An independent, browser-based 3D social-room prototype. This is a new project, not an official Rec Room client, and it does not connect to Rec Room's former services.

## What is in the first prototype

- A Three.js 3D room that runs in a modern browser.
- Desktop movement with WASD / arrow keys and mouse-look.
- Simple touch movement controls for phones and tablets.
- A small Node.js + WebSocket server for syncing player positions.
- Original placeholder geometry only. Add only assets you created or are licensed/authorized to use.

## Run the browser client

The client is static and can be hosted with GitHub Pages:

1. Open the repository's **Settings → Pages**.
2. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
3. Open the published Pages URL.

The client works in solo mode if no multiplayer server URL is configured.

## Run your own multiplayer server

Requires Node.js 18 or newer:

```sh
npm install
npm start
```

The server listens on port `3000` by default (or the `PORT` environment variable). Deploy `server.js` and `package.json` to a Node.js host that supports WebSockets.

After deploying, edit `config.js` and set `window.REC_BROWSER_SERVER` to your server's secure WebSocket URL, for example `wss://your-server.example`. Commit that change and reload the site.

For local testing, run the server and set the URL to `ws://localhost:3000`.

## Controls

- **Desktop:** click **Play**, then use WASD / arrow keys to move. Move the mouse to look around. Press **Esc** to release the mouse.
- **Touch:** use the on-screen directional pad and drag the look area to turn.
- **Chat:** the prototype includes a local chat panel; network chat will be added in a later step.

## Project layout

- `index.html` — page structure and Three.js import map.
- `styles.css` — responsive interface.
- `game.js` — 3D scene, controls, and multiplayer client.
- `config.js` — multiplayer server URL.
- `server.js` — minimal WebSocket position-sync server.

## Current limitations

This is a starter prototype, not a complete recreation of Rec Room. It currently has one simple room, placeholder avatars, and position syncing only. Accounts, room creation/saving, moderation, voice, inventory, and persistence are not implemented yet. The server keeps player state in memory and clears it when it restarts.
