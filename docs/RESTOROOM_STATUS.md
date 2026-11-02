# RestoRoom research notes

Project: https://github.com/RestoRoom/RestoRoom

The upstream README describes RestoRoom as an early work-in-progress community effort to reimplement Rec Room server infrastructure. Its published status says it is not playable yet. The listed work includes network protocol research; account/auth, room server, Photon relay, and client redirect/patching are listed as not started.

## What this means for Rec-browser

RestoRoom is not currently a drop-in backend for this browser project:
- It does not provide a ready-to-use browser game client.
- Its documented server components are not yet complete.
- This repository currently uses its own small WebSocket message format, not a verified RestoRoom-compatible protocol.

## Safe integration approach

1. Follow upstream releases and documentation.
2. Do not copy unverified protocol guesses into production code.
3. If RestoRoom publishes a documented, authorized API, build a separate adapter under `src/adapters/restoroom/`.
4. Keep the independent room server working even if the adapter is unavailable.
5. Do not redistribute Rec Room proprietary files or bypass client protections.

Upstream status can change. Re-check the RestoRoom README and documentation before implementing an adapter.
