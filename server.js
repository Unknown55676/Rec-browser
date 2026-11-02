const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS = 40;
const players = new Map();

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify({ ok: true, players: players.size, maxPlayers: MAX_PLAYERS }));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("Rec-browser multiplayer server is running.\n");
});

const wss = new WebSocketServer({ server, maxPayload: 4096 });
function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}
function broadcast(payload, except) {
  for (const client of wss.clients) if (client !== except) send(client, payload);
}
function cleanName(value) {
  return String(value ?? "Guest").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 18) || "Guest";
}
function cleanColor(value) {
  const color = String(value ?? "");
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#f05c7b";
}
function presence() {
  broadcast({ type: "presence", count: players.size });
}

wss.on("connection", (socket) => {
  if (players.size >= MAX_PLAYERS) {
    send(socket, { type: "error", message: "This room is full." });
    socket.close(1008, "Room full");
    return;
  }
  const id = randomUUID();
  const player = { id, name: "Guest", color: "#f05c7b", x: 0, y: 0, z: 0, rotation: 0 };
  players.set(id, player);
  socket.playerId = id;
  send(socket, { type: "welcome", id, players: [...players.values()], count: players.size });
  broadcast({ type: "player-joined", player }, socket);
  presence();

  socket.on("message", (raw) => {
    if (raw.length > 2048) return;
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    if (!message || typeof message.type !== "string") return;

    if (message.type === "profile") {
      player.name = cleanName(message.name);
      player.color = cleanColor(message.color);
      broadcast({ type: "player-updated", player }, socket);
      send(socket, { type: "profile-accepted", player });
      return;
    }

    if (message.type === "move") {
      const x = Number(message.x), z = Number(message.z), rotation = Number(message.rotation);
      if (![x, z, rotation].every(Number.isFinite)) return;
      player.x = Math.max(-10.8, Math.min(10.8, x));
      player.y = 0;
      player.z = Math.max(-10.8, Math.min(10.8, z));
      player.rotation = Math.max(-Math.PI * 100, Math.min(Math.PI * 100, rotation));
      broadcast({ type: "player-moved", player }, socket);
      return;
    }

    if (message.type === "chat") {
      const text = String(message.text ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 180);
      if (!text) return;
      broadcast({ type: "chat", id, name: player.name, text, time: Date.now() });
      return;
    }

    if (message.type === "emote") {
      const emote = message.emote === "wave" ? "wave" : null;
      if (emote) broadcast({ type: "emote", id, name: player.name, emote });
    }
  });

  socket.on("close", () => {
    players.delete(id);
    broadcast({ type: "player-left", id });
    presence();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Rec-browser multiplayer server listening on port ${PORT}`);
});