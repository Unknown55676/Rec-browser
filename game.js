import * as THREE from "three";

const root = document.querySelector("#game-root");
const welcome = document.querySelector("#welcome");
const hud = document.querySelector("#hud");
const touchControls = document.querySelector("#touch-controls");
const crosshair = document.querySelector("#crosshair");
const connectionDot = document.querySelector("#connection-dot");
const connectionLabel = document.querySelector("#connection-label");
const toast = document.querySelector("#toast");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc9e8);
scene.fog = new THREE.Fog(0x9bc9e8, 24, 75);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 150);
camera.position.set(0, 1.65, 7);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe6f5ff, 0x657080, 2.0));
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
const welcomeSign = box(3.6, 1.4, 0.18, 0x27364b, 0, 2.2, -11.25);

const avatarGeometry = new THREE.CapsuleGeometry(0.38, 0.8, 5, 10);
function makeAvatar(color = 0xf05c7b) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(avatarGeometry, new THREE.MeshStandardMaterial({ color, roughness: 0.72 }));
  body.position.y = 0.85;
  body.castShadow = true;
  group.add(body);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0x172033 }));
  face.position.set(0.13, 1.13, -0.31);
  group.add(face);
  return group;
}

const localAvatar = makeAvatar(0xf05c7b);
scene.add(localAvatar);
const remoteAvatars = new Map();
const keys = new Set();
const move = { forward: false, back: false, left: false, right: false };
let yaw = 0, pitch = 0, started = false, socket = null, playerId = null, lastSend = 0;
const clock = new THREE.Clock();

function addRemote(player) {
  if (player.id === playerId || remoteAvatars.has(player.id)) return;
  const avatar = makeAvatar(0x63b8dc);
  avatar.position.set(player.x, 0, player.z);
  avatar.rotation.y = player.rotation || 0;
  scene.add(avatar);
  remoteAvatars.set(player.id, avatar);
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 2600);
}
function connectMultiplayer() {
  const url = window.REC_BROWSER_SERVER;
  if (!url) return;
  try {
    socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      connectionDot.classList.add("connected");
      connectionLabel.textContent = "Connected";
      showToast("Connected to multiplayer!");
    });
    socket.addEventListener("message", (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === "welcome") {
        playerId = data.id;
        data.players.forEach(addRemote);
      } else if (data.type === "player-joined") {
        addRemote(data.player);
      } else if (data.type === "player-moved") {
        const avatar = remoteAvatars.get(data.player.id);
        if (avatar) {
          avatar.position.set(data.player.x, 0, data.player.z);
          avatar.rotation.y = data.player.rotation || 0;
        }
      } else if (data.type === "player-left") {
        const avatar = remoteAvatars.get(data.id);
        if (avatar) scene.remove(avatar);
        remoteAvatars.delete(data.id);
      } else if (data.type === "error") showToast(data.message);
    });
    socket.addEventListener("close", () => {
      connectionDot.classList.remove("connected");
      connectionLabel.textContent = "Offline";
    });
    socket.addEventListener("error", () => {
      connectionLabel.textContent = "Server unavailable";
    });
  } catch {
    connectionLabel.textContent = "Solo mode";
  }
}

document.querySelector("#play-button").addEventListener("click", () => {
  started = true;
  welcome.classList.add("hidden");
  hud.classList.remove("hidden");
  crosshair.classList.remove("hidden");
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) touchControls.classList.remove("hidden");
  connectMultiplayer();
  if (innerWidth > 800 && renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
});
document.querySelector("#leave-button").addEventListener("click", () => {
  started = false;
  welcome.classList.remove("hidden");
  hud.classList.add("hidden");
  touchControls.classList.add("hidden");
  crosshair.classList.add("hidden");
  if (document.pointerLockElement) document.exitPointerLock();
});
document.querySelector("#chat-toggle").addEventListener("click", () => document.querySelector("#chat-panel").classList.toggle("hidden"));
document.querySelector("#chat-close").addEventListener("click", () => document.querySelector("#chat-panel").classList.add("hidden"));
document.querySelector("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#chat-input");
  const value = input.value.trim();
  if (!value) return;
  const line = document.createElement("p");
  line.className = "chat-line";
  const name = document.createElement("b");
  name.textContent = "You: ";
  line.append(name, document.createTextNode(value));
  document.querySelector("#chat-messages").append(line);
  input.value = "";
  document.querySelector("#chat-messages").scrollTop = 99999;
});

addEventListener("keydown", (event) => {
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
const lookArea = document.querySelector("#look-area");
let lastTouch = null;
lookArea.addEventListener("pointerdown", (event) => { lastTouch = { x: event.clientX, y: event.clientY }; lookArea.setPointerCapture(event.pointerId); });
lookArea.addEventListener("pointermove", (event) => {
  if (!lastTouch) return;
  yaw -= (event.clientX - lastTouch.x) * 0.009;
  pitch = Math.max(-1.1, Math.min(1.1, pitch - (event.clientY - lastTouch.y) * 0.006));
  lastTouch = { x: event.clientX, y: event.clientY };
});
lookArea.addEventListener("pointerup", () => { lastTouch = null; });
lookArea.addEventListener("pointercancel", () => { lastTouch = null; });

function update(dt) {
  if (started) {
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
      socket.send(JSON.stringify({ type: "move", x: localAvatar.position.x, y: 0, z: localAvatar.position.z, rotation: yaw }));
      lastSend = now;
    }
  }
}
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
