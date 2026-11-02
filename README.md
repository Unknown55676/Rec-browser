# Rec-browser

An independent browser-based 3D social-world project. The goal is to build a playable multiplayer experience with rooms, avatars, chat, and creator tools.

> **Important:** This is not the original Rec Room client, does not connect to the former official Rec Room services, and does not include proprietary Rec Room source code or assets. This project uses original placeholder geometry and its own networking protocol.

## Live project

- GitHub Pages: https://unknown55676.github.io/Rec-browser/
- Source: https://github.com/Unknown55676/Rec-browser

## Features in the current build

- Three.js 3D lobby with keyboard/mouse and touch controls.
- Choose a display name and avatar color.
- Name tags above player avatars.
- WebSocket player movement synchronization.
- Shared room chat when a multiplayer server is configured.
- Wave emote and live room player count.
- Solo mode when no server URL is configured.
- Local profile name and color saved in the browser on that device.

## Run the browser client

The client is static and can be hosted with GitHub Pages. In **Settings → Pages**, choose **GitHub Actions** as the deployment source. The included workflow publishes the browser files.

The client runs in solo mode when no multiplayer server URL is configured.

## Run the multiplayer server

The Node.js server must run separately from GitHub Pages. It needs a host that supports persistent Node.js processes and WebSockets.

Requirements: Node.js 18 or newer.

~~~sh
npm install
npm start
~~~

The server listens on port 3000 by default (or the PORT environment variable). After deploying it, set window.REC_BROWSER_SERVER in config.js to its secure WebSocket URL, for example:

~~~js
window.REC_BROWSER_SERVER = "wss://your-server.example";
~~~

The browser site should use wss:// when served over HTTPS. Do not put secrets in the public client-side config.

## Controls

- **Desktop:** click **Play**, use WASD / arrow keys to move, and move the mouse to look around. Press **Esc** to release the mouse.
- **Touch:** use the on-screen directional pad and drag the look area to turn.
- **Chat:** open Chat and send a message. Messages are shared only when connected to the multiplayer server; in solo mode they are displayed locally.
- **Wave:** use the Wave button to send a wave emote to connected players.

## Multiplayer protocol

The server currently supports:
- profile: set a display name and avatar color.
- move: update the player's position and rotation.
- chat: broadcast a plain-text room message.
- emote: broadcast a wave.
- Presence updates and join/leave events.

The server limits a room to 40 connections and validates incoming message size and numeric movement values. This is an early prototype, not a production-secure public service: it does not yet include accounts, persistent storage, rate limiting, moderation tools, room isolation, or anti-abuse systems. Do not expose it to a large public audience without adding those protections.

## Roadmap and technical notes

- [Project plan](docs/PROJECT_PLAN.md)
- [Architecture and hosting](docs/ARCHITECTURE.md)
- [RestoRoom research/status](docs/RESTOROOM_STATUS.md)
- [Asset and content rules](docs/ASSETS_AND_CONTENT.md)

## RestoRoom compatibility

We are tracking [RestoRoom](https://github.com/RestoRoom/RestoRoom), a separate community server-preservation project. It is a separate early-WIP effort, not a plug-in backend for this browser project. Do not assume compatibility without a documented protocol and authorized client integration.

## Current limitations

This remains an independent prototype, not a complete social game or an emulation of the original Rec Room. Accounts, persistent profiles, room creation/saving, room discovery, moderation, voice, inventory, physics interactions, and creator tools are not implemented. The multiplayer server keeps player state in memory and clears it when it restarts. GitHub Pages cannot host the Node.js WebSocket server.

## Contributions and legal

Only add original assets or content that you have permission to use. Do not commit proprietary game files, extracted assets, account data, or private credentials. Do not bypass DRM, anti-cheat, access controls, or service restrictions.