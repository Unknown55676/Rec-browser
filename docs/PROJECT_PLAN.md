# Rec-browser project plan

## Goal

Build a browser-playable social-room platform with accounts, rooms, avatars, chat, creator tools, and multiplayer. The long-term preservation goal is to support community-created content and, only where technically and legally permitted, interoperability with independently developed services.

**Important:** this repository is not the original Rec Room client. It does not contain Rec Room's proprietary source code, assets, or a working port of its client. The current web app is an independent prototype.

## Development stages

### Stage 0 — Honest working baseline
- [x] Publish the browser prototype through GitHub Pages.
- [x] Basic Three.js scene and desktop/touch movement.
- [x] Minimal WebSocket position synchronization.
- [ ] Automated checks for client syntax and server startup.
- [ ] Fix server identity generation and validate incoming messages.

### Stage 1 — Multiplayer foundation
- [ ] Stable player IDs and server-authoritative movement.
- [ ] Rooms/lobbies with room capacity and isolation.
- [ ] Network chat with message length and rate limits.
- [ ] Reconnect handling and clean disconnects.
- [ ] Persistent room state using a database.
- [ ] Deployment guide for a separately hosted Node service.

### Stage 2 — Accounts and safety
- [ ] Account registration and sign-in.
- [ ] Secure password hashing and session handling.
- [ ] Display names and profile settings.
- [ ] Block, mute, report, and moderator tools.
- [ ] Privacy policy and data deletion process.

### Stage 3 — Social world features
- [ ] Avatar customization using original or properly licensed assets.
- [ ] Emotes and basic interactions.
- [ ] Room browser and private rooms.
- [ ] Friends/invites only after account and safety foundations exist.
- [ ] Voice only after moderation, consent, and abuse controls are designed.

### Stage 4 — Creator tools
- [ ] Room editor and save/load.
- [ ] Placeable objects and interactive components.
- [ ] Import pipeline for user-owned or openly licensed assets.
- [ ] Versioned room format and backups.
- [ ] Permissions for room owners and collaborators.

### Stage 5 — Preservation/interoperability research
- [ ] Track public community preservation projects and their documented interfaces.
- [ ] Review legal permissions and technical feasibility before implementing compatibility.
- [ ] Keep any compatibility adapter separate from the independent game systems.
- [ ] Do not bundle proprietary game files or bypass access controls, DRM, anti-cheat, or account protections.

## What "complete" means

A working social game requires both a browser client and a backend. GitHub Pages hosts static files only; it does not run the Node.js WebSocket server. The backend must be deployed separately to a host that supports persistent Node processes and WebSockets.
