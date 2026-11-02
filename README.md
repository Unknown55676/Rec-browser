# Rec-browser

An independent browser-based social-world project. The goal is to build a playable 3D multiplayer experience with rooms, avatars, chat, and creator tools.

> **Important:** This is not the original Rec Room client, does not connect to the former official Rec Room services, and does not include proprietary Rec Room source code or assets. The current published site is an early independent prototype.

## Live project

- GitHub Pages: https://unknown55676.github.io/Rec-browser/
- Source: https://github.com/Unknown55676/Rec-browser

## Current prototype

- Three.js 3D scene in a modern browser.
- Desktop keyboard/mouse controls.
- Basic touch controls.
- Minimal Node.js + WebSocket position synchronization.
- Original placeholder geometry only.

## Run the browser client

The client is static and can be hosted with GitHub Pages. The repository includes a GitHub Actions Pages workflow. In **Settings → Pages**, choose **GitHub Actions** as the deployment source.

The client can run in solo mode when no multiplayer server URL is configured.

## Run the multiplayer server

Requires Node.js 18 or newer:

```sh
npm install
npm start
```

The server listens on port `3000` by default (or the `PORT` environment variable). GitHub Pages cannot run this Node server: deploy it separately to a Node.js host that supports persistent processes and WebSockets.

After deploying, set `window.REC_BROWSER_SERVER` in `config.js` to the server's secure WebSocket URL, such as `wss://your-server.example`. Do not put secrets in this public client-side file.

## Controls

- **Desktop:** click **Play**, use WASD / arrow keys to move, and move the mouse to look around. Press **Esc** to release the mouse.
- **Touch:** use the on-screen directional pad and drag the look area to turn.
- **Chat:** the current chat UI is a prototype; do not assume messages are persistent or networked.

## Roadmap and technical notes

- [Project plan](docs/PROJECT_PLAN.md)
- [Architecture and hosting](docs/ARCHITECTURE.md)
- [RestoRoom research/status](docs/RESTOROOM_STATUS.md)
- [Asset and content rules](docs/ASSETS_AND_CONTENT.md)

## RestoRoom compatibility

We are tracking [RestoRoom](https://github.com/RestoRoom/RestoRoom), a separate community server-preservation project. Its upstream README currently describes it as early WIP and says it is not playable yet. It is not currently a plug-in backend for this browser project. See [our notes](docs/RESTOROOM_STATUS.md) before assuming compatibility.

## Current limitations

This is not a complete social game yet. Accounts, room creation/saving, moderation, voice, inventory, persistence, and a verified interoperability layer are not implemented. The current server keeps player state in memory and clears it when it restarts.

## Contributions and legal

Only add original assets or content that you have permission to use. Do not commit proprietary game files, extracted assets, account data, or private credentials. See [asset guidance](docs/ASSETS_AND_CONTENT.md).
