import * as THREE from "three";

const $ = (selector) => document.querySelector(selector);
const root = $("#game-root");
const welcome = $("#welcome");
const hud = $("#hud");
const touchControls = $("#touch-controls");
const crosshair = $("#crosshair");
const connectionDot = $("#connection-dot");
const connectionLabel = $("#connection-label");
const toast = $("#toast");
const chatPanel = $("#chat-panel");
const chatMessages = $("#chat-messages");
const playerCount = $("#player-count");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc9e8);
scene.fog = new THREE.Fog(0x9bc9e8, 24, 75);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 150);
camera.position.set(0, 1.65, 7);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe6f5ff, 0x657080, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2.1);
sun.position.set(-5, 12, 7);
sun.castShadow = true;
scene.add(sun);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x8796a5, roughness: 0.92 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(80, 40, 0x637384, 0x9eabb6);
grid.position.y = 0.012;
scene.add(grid);

function box(w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
box(24, 0.4, 0.5, 0x526476, 0, 0.2, -12);
box(24, 0.4, 0.5, 0x526476, 0, 0.2, 12);
box(0.5, 0.4, 24, 0x526476, -12, 0.2, 0);
box(0.5, 0.4, 24, 0x526476, 12, 0.2, 0);
box(4, 2.8, 0.35, 0xf05c7b, 0, 1.4, -11.6);
box(1.2, 0.5, 1.2, 0xf4c66a, -5, 0.25, -4);
box(1.2, 0.5, 1.2, 0x7bd5bd, 5, 0.25, -4);
box(2.4, 0.5, 1.2, 0x9d91e8, 0, 0.25, 4);

// Simple original scenery to make the lobby feel less empty.
for (const [x, z, color] of [[-9,-9,0x5c9c87],[9,-9,0x5c9c87],[-9,9,0x5c9c87],[9,9,0x5c9c87]]) {
  const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0x647080 }));
  planter.position.set(x, 0.22, z); planter.castShadow = true; scene.add(planter);
  const tree = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.5, 8), new THREE.MeshStandardMaterial({ color }));
  tree.position.set(x, 1.65, z); tree.castShadow = true; scene.add(tree);
}

const avatarGeometry = new THREE.CapsuleGeometry(0.38, 0.8, 5, 10);
function makeNameTag(name) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(18,23,37,.82)";
  ctx.beginPath(); ctx.roundRect(8, 8, 496, 112, 28); ctx.fill();
  ctx.font = "bold 48px system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff"; ctx.fillText(String(name).slice(0, 18), 256, 64, 460);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(1.7, 0.43, 1);
  sprite.position.y = 2.05;
  return sprite;
}
function makeAvatar(color = "#f05c7b", name = "Guest") {
  const group = new THREE.Group();
  const body = new THREE.Mesh(avatarGeometry, new THREE.MeshStandardMaterial({ color, roughness: 0.72 }));
  body.position.y = 0.85; body.castShadow = true; group.add(body);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x172033 });
  for (const x of [-0.13, 0.13]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), eyeMaterial);
    eye.position.set(x, 1.13, -0.31); group.add(eye);
  }
  group.add(makeNameTag(name));
  group.userData.body = body;
  group.userData.baseColor = color;
  return group;
}
function setAvatarProfile(avatar, name, color) {
  if (color) {
    avatar.userData.body.material.color.set(color);
    avatar.userData.baseColor = color;
  }
  if (name) {
    const oldTag = avatar.children.find((child) => child.isSprite);
    if (oldTag) {
      avatar.remove(oldTag);
      oldTag.material.map?.dispose();
      oldTag.material.dispose();
    }
    avatar.add(makeNameTag(name));
  }
}
const localAvatar = makeAvatar("#f05c7b", "Guest");
scene.add(localAvatar);
const remoteAvatars = new Map();
const keys = new Set();
const move = { forward: false, back: false, left: false, right: false };
let yaw = 0, pitch = 0, started = false, socket = null, playerId = null, lastSend = 0;
let selectedColor = localStorage.getItem("recBrowserColor") || "#f05c7b";
let playerName = localStorage.getItem("recBrowserName") || "Guest";
let toastTimer = 0;
$("#player-name").value = playerName;
document.querySelectorAll(".color-choice").forEach((button) => {
  button.classList.toggle("selected", button.dataset.color === selectedColor);
});
if (!document.querySelector(".color-choice.selected")) selectedColor = "#f05c7b";
setAvatarProfile(localAvatar, playerName, selectedColor);

function updateCount(count) {
  playerCount.textContent = `${count} ${count === 1 ? "here" : "here"}`;
}
function addRemote(player) {
  if (!player || player.id === playerId || remoteAvatars.has(player.id)) return;
  const avatar = makeAvatar(player.color || "#55b8e8", player.name || "Guest");
  avatar.position.set(player.x || 0, 0, player.z || 0);
  avatar.rotation.y = player.rotation || 0;
  scene.add(avatar);
  remoteAvatars.set(player.id, avatar);
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2600);
}
function addChatLine(name, text, system = false) {
  const line = document.createElement("p");
  line.className = system ? "system-message" : "chat-line";
  if (system) line.textContent = text;
  else {
    const label = document.createElement("b");
    label.textContent = `${name}: `;
    line.append(label, document.createTextNode(text));
  }
  chatMessages.append(line);
  while (chatMessages.children.length > 80) chatMessages.firstElementChild.remove();
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function connectMultiplayer() {
  const url = window.REC_BROWSER_SERVER;
  if (!url) {
    connectionLabel.textContent = "Solo mode";
    addChatLine("", "You are in solo mode. Add a multiplayer server URL to enable shared chat.", true);
    return;
  }
  try {
    socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      connectionDot.classList.add("connected");
      connectionLabel.textContent = "Connecting…";
    });
    socket.addEventListener("message", (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === "welcome") {
        playerId = data.id;
        data.players.forEach(addRemote);
        socket.send(JSON.stringify({ type: "profile", name: playerName, color: selectedColor }));
        connectionLabel.textContent = "Connected";
        updateCount(data.count || data.players.length);
        addChatLine("", "Connected to the shared lobby.", true);
      } else if (data.type === "player-joined") {
        addRemote(data.player);
        addChatLine("", `${data.player.name || "A player"} joined the room.`, true);
      } else if (data.type === "player-updated") {
        const avatar = remoteAvatars.get(data.player.id);
        if (avatar) setAvatarProfile(avatar, data.player.name, data.player.color);
      } else if (data.type === "player-moved") {
        const avatar = remoteAvatars.get(data.player.id);
        if (avatar) {
          avatar.position.set(data.player.x, 0, data.player.z);
          avatar.rotation.y = data.player.rotation || 0;
        }
      } else if (data.type === "player-left") {
        const avatar = remoteAvatars.get(data.id);
        if (avatar) {
          scene.remove(avatar);
          avatar.traverse((obj) => { if (obj.isSprite) { obj.material.map?.dispose(); obj.material.dispose(); } });
          avatar.traverse((obj) => { if (obj.isMesh) obj.geometry.dispose(); });
        }
        remoteAvatars.delete(data.id);
        addChatLine("", "A player left the room.", true);
      } else if (data.type === "presence") {
        updateCount(data.count);
      } else if (data.type === "chat") {
        addChatLine(data.name || "Guest", data.text || "");
      } else if (data.type === "emote") {
        const avatar = remoteAvatars.get(data.id);
        if (avatar && data.emote === "wave") {
          avatar.rotation.z = -0.22;
          setTimeout(() => { if (avatar.parent) avatar.rotation.z = 0; }, 650);
          showToast(`${data.name || "Someone"} waved!`);
        }
      } else if (data.type === "error") showToast(data.message);
    });
    socket.addEventListener("close", () => {
      connectionDot.classList.remove("connected");
      connectionLabel.textContent = "Offline";
      socket = null;
      updateCount(1);
    });
    socket.addEventListener("error", () => {
      connectionDot.classList.remove("connected");
      connectionLabel.textContent = "Server unavailable";
    });
  } catch {
    connectionLabel.textContent = "Solo mode";
  }
}

document.querySelectorAll(".color-choice").forEach((button) => {
  button.addEventListener("click", () => {
    selectedColor = button.dataset.color;
    document.querySelectorAll(".color-choice").forEach((item) => item.classList.toggle("selected", item === button));
  });
});
$("#play-button").addEventListener("click", () => {
  playerName = $("#player-name").value.trim().replace(/[<>]/g, "").slice(0, 18) || "Guest";
  localStorage.setItem("recBrowserName", playerName);
  localStorage.setItem("recBrowserColor", selectedColor);
  setAvatarProfile(localAvatar, playerName, selectedColor);
  started = true;
  welcome.classList.add("hidden");
  hud.classList.remove("hidden");
  crosshair.classList.remove("hidden");
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) touchControls.classList.remove("hidden");
  connectMultiplayer();
  if (innerWidth > 800 && renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
});
$("#leave-button").addEventListener("click", () => {
  started = false;
  welcome.classList.remove("hidden");
  hud.classList.add("hidden");
  touchControls.classList.add("hidden");
  crosshair.classList.add("hidden");
  if (document.pointerLockElement) document.exitPointerLock();
  if (socket) { socket.close(); socket = null; }
  for (const avatar of remoteAvatars.values()) scene.remove(avatar);
  remoteAvatars.clear();
  playerId = null;
  connectionDot.classList.remove("connected");
  connectionLabel.textContent = "Solo mode";
  updateCount(1);
});
$("#chat-toggle").addEventListener("click", () => chatPanel.classList.toggle("hidden"));
$("#chat-close").addEventListener("click", () => chatPanel.classList.add("hidden"));
$("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#chat-input");
  const value = input.value.trim().slice(0, 180);
  if (!value) return;
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "chat", text: value }));
  } else {
    addChatLine(playerName, value);
  }
  input.value = "";
});
$("#emote-button").addEventListener("click", () => {
  localAvatar.rotation.z = -0.22;
  setTimeout(() => { localAvatar.rotation.z = 0; }, 650);
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "emote", emote: "wave" }));
  else showToast("👋 You waved!");
});

addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;
  keys.add(event.key.toLowerCase());
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(event.key.toLowerCase())) event.preventDefault();
});
addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
addEventListener("blur", () => keys.clear());
renderer.domElement.addEventListener("click", () => {
  if (started && innerWidth > 800 && document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock?.();
});
document.addEventListener("mousemove", (event) => {
  if (!started || document.pointerLockElement !== renderer.domElement) return;
  yaw -= event.movementX * 0.0022;
  pitch = Math.max(-1.1, Math.min(1.1, pitch - event.movementY * 0.0018));
});

document.querySelectorAll("[data-move]").forEach((button) => {
  const direction = button.dataset.move;
  const on = (event) => { event.preventDefault(); move[direction] = true; };
  const off = (event) => { event.preventDefault(); move[direction] = false; };
  button.addEventListener("pointerdown", on);
  button.addEventListener("pointerup", off);
  button.addEventListener("pointerleave", off);
  button.addEventListener("pointercancel", off);
});
const lookArea = $("#look-area");
let lastTouch = null;
lookArea.addEventListener("pointerdown", (event) => {
  lastTouch = { x: event.clientX, y: event.clientY };
  lookArea.setPointerCapture(event.pointerId);
});
lookArea.addEventListener("pointermove", (event) => {
  if (!lastTouch) return;
  yaw -= (event.clientX - lastTouch.x) * 0.009;
  pitch = Math.max(-1.1, Math.min(1.1, pitch - (event.clientY - lastTouch.y) * 0.006));
  lastTouch = { x: event.clientX, y: event.clientY };
});
lookArea.addEventListener("pointerup", () => { lastTouch = null; });
lookArea.addEventListener("pointercancel", () => { lastTouch = null; });

function update(dt) {
  if (!started) return;
  const forward = move.forward || keys.has("w") || keys.has("arrowup");
  const back = move.back || keys.has("s") || keys.has("arrowdown");
  const left = move.left || keys.has("a") || keys.has("arrowleft");
  const right = move.right || keys.has("d") || keys.has("arrowright");
  const direction = new THREE.Vector3(Number(right) - Number(left), 0, Number(back) - Number(forward));
  if (direction.lengthSq()) {
    direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    localAvatar.position.addScaledVector(direction, 5 * dt);
  }
  localAvatar.position.x = THREE.MathUtils.clamp(localAvatar.position.x, -10.8, 10.8);
  localAvatar.position.z = THREE.MathUtils.clamp(localAvatar.position.z, -10.8, 10.8);
  localAvatar.rotation.y = yaw;
  camera.position.set(localAvatar.position.x, 1.65, localAvatar.position.z);
  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  const now = performance.now();
  if (socket?.readyState === WebSocket.OPEN && now - lastSend > 70) {
    socket.send(JSON.stringify({ type: "move", x: localAvatar.position.x, z: localAvatar.position.z, rotation: yaw }));
    lastSend = now;
  }
}
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
addEventListener("beforeunload", () => socket?.close());
