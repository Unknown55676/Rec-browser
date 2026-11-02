const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS = 40;
const players = new Map();

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify({ ok: true, players: players.size }));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Rec-browser multiplayer server is running.\n");
});

const wss = new WebSocketServer({ server });
function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}
function broadcast(payload, except) {
  for (const client of wss.clients) if (client !== except) send(client, payload);
}

wss.on("connection", (socket) => {
  if (players.size >= MAX_PLAYERS) {
    send(socket, { type: "error", message: "This room is full." });
    socket.close(1008, "Room full");
    return;
  }
  const id = randomUUID();
  const player = { id, name: "Guest", x: 0, y: 0, z: 0, rotation: 0 };
  players.set(id, player);
  socket.playerId = id;
  send(socket, { type: "welcome", id, players: [...players.values()] });
  broadcast({ type: "player-joined", player }, socket);

  socket.on("message", (raw) => {
    if (raw.length > 2048) return;
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    if (message.type !== "move") return;
    const x = Number(message.x), y = Number(message.y), z = Number(message.z), rotation = Number(message.rotation);
    if (![x, y, z, rotation].every(Number.isFinite)) return;
    player.x = Math.max(-100, Math.min(100, x));
    player.y = Math.max(-10, Math.min(30, y));
    player.z = Math.max(-100, Math.min(100, z));
    player.rotation = Math.max(-Math.PI * 100, Math.min(Math.PI * 100, rotation));
    broadcast({ type: "player-moved", player }, socket);
  });

  socket.on("close", () => {
    players.delete(id);
    broadcast({ type: "player-left", id });
  });
});


server.listen(PORT, "0.0.0.0", () => {
  console.log(`Rec-browser server listening on port ${PORT}`);
});
