import * as THREE from "../assets/vendor/three.module.min.js";

const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 40;
const canvas = document.getElementById("architecture");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setSize(WIDTH, HEIGHT, false);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8c5c8);
scene.fog = new THREE.Fog(0xc4b8a4, 48, 112);
const camera = new THREE.PerspectiveCamera(42, WIDTH / HEIGHT, 0.1, 180);
scene.add(new THREE.HemisphereLight(0xe4eff0, 0x4c4232, 1.65));
const sun = new THREE.DirectionalLight(0xffd3a0, 3.0);
sun.position.set(-18, 24, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 32;
sun.shadow.camera.bottom = -28;
sun.shadow.bias = -0.00025;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xaabdc3, 0.8);
fill.position.set(14, 12, -18);
scene.add(fill);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(150, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: "varying float h; void main(){ h=normalize(position).y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "varying float h; void main(){ float a=smoothstep(-0.18,0.22,h); float b=smoothstep(0.2,0.95,h); vec3 low=vec3(0.86,0.68,0.47); vec3 mid=vec3(0.66,0.72,0.73); vec3 high=vec3(0.31,0.43,0.52); gl_FragColor=vec4(mix(mix(low,mid,a),high,b),1.0); }",
  }),
);
// Keep the sky as a controlled clean background; large proxy geometry can
// otherwise silhouette against the horizon during the moving camera pass.
scene.remove(sky);

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function textureCanvas(kind, seed) {
  const size = 256;
  const surface = document.createElement("canvas");
  surface.width = size;
  surface.height = size;
  const ctx = surface.getContext("2d", { willReadFrequently: true });
  const rand = seeded(seed);
  const bases = kind === "limestone" ? [190, 179, 158] : kind === "wood" ? [106, 69, 42] : kind === "ground" ? [105, 91, 70] : kind === "water" ? [54, 78, 79] : [145, 142, 132];
  const pixels = ctx.createImageData(size, size);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const noise = (rand() - 0.5) * (kind === "wood" ? 24 : 18);
    pixels.data[i] = Math.max(0, Math.min(255, bases[0] + noise));
    pixels.data[i + 1] = Math.max(0, Math.min(255, bases[1] + noise));
    pixels.data[i + 2] = Math.max(0, Math.min(255, bases[2] + noise));
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  if (kind === "concrete" || kind === "limestone") {
    ctx.globalAlpha = kind === "concrete" ? 0.12 : 0.18;
    ctx.strokeStyle = kind === "concrete" ? "#554e42" : "#716650";
    ctx.lineWidth = 1;
    for (let y = 18; y < size; y += kind === "concrete" ? 36 : 64) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.round(rand() * 2));
      ctx.lineTo(size, y + Math.round(rand() * 2));
      ctx.stroke();
    }
    if (kind === "limestone") {
      for (let x = 58; x < size; x += 72) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  } else if (kind === "wood") {
    ctx.globalAlpha = 0.22;
    for (let x = 3; x < size; x += 8) {
      ctx.fillStyle = rand() > 0.5 ? "#3d2819" : "#e4b979";
      ctx.fillRect(x, 0, rand() * 2 + 1, size);
    }
    ctx.globalAlpha = 1;
  } else if (kind === "ground") {
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = rand() > 0.5 ? "#3b352c" : "#c1a77f";
      ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 3, 1 + rand() * 2);
    }
    ctx.globalAlpha = 1;
  }
  const map = new THREE.CanvasTexture(surface);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}

const concreteMap = textureCanvas("concrete", 17);
const stoneMap = textureCanvas("limestone", 31);
const woodMap = textureCanvas("wood", 53);
const groundMap = textureCanvas("ground", 71);
const waterMap = textureCanvas("water", 89);
const concrete = new THREE.MeshStandardMaterial({ map: concreteMap, color: 0xd5d0c4, roughness: 0.86, metalness: 0.03 });
const limestone = new THREE.MeshStandardMaterial({ map: stoneMap, color: 0xf1e7d4, roughness: 0.72, metalness: 0.02 });
const teak = new THREE.MeshStandardMaterial({ map: woodMap, color: 0xd3a878, roughness: 0.56, metalness: 0.02 });
const darkBronze = new THREE.MeshStandardMaterial({ color: 0x423b30, roughness: 0.34, metalness: 0.72 });
const rebarMaterial = new THREE.MeshStandardMaterial({ color: 0x5c5b54, roughness: 0.43, metalness: 0.78 });
const soil = new THREE.MeshStandardMaterial({ map: groundMap, color: 0xc5a980, roughness: 1, metalness: 0 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x819a9b, roughness: 0.12, metalness: 0.38, transparent: true, opacity: 0.54, side: THREE.DoubleSide, depthWrite: false, clearcoat: 0.9, clearcoatRoughness: 0.12 });
const water = new THREE.MeshPhysicalMaterial({ map: waterMap, color: 0x8da5a1, roughness: 0.14, metalness: 0.58, transparent: true, opacity: 0.9, clearcoat: 1, clearcoatRoughness: 0.1 });
const foliage = new THREE.MeshStandardMaterial({ color: 0x425142, roughness: 0.93 });
const bark = new THREE.MeshStandardMaterial({ color: 0x62503a, roughness: 0.94 });
const interiorLight = new THREE.MeshStandardMaterial({ color: 0xffd6a1, emissive: 0xffa845, emissiveIntensity: 1.2, roughness: 0.35 });

function box(name, width, height, depth, material, x = 0, y = 0, z = 0, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = material !== glass && material !== water;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function ease01(value) {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function progress(time, start, end) {
  return ease01((time - start) / (end - start));
}

function verticalBuild(mesh, time, start, end, baseY, fullHeight) {
  const p = progress(time, start, end);
  mesh.scale.y = Math.max(0.001, p);
  mesh.position.y = baseY + fullHeight * p * 0.5;
  mesh.visible = time >= start;
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), soil);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.09;
ground.receiveShadow = true;
scene.add(ground);

const site = new THREE.Group();
scene.add(site);
// Loose site gravel, stakes and a low perimeter curb give the opening real scale.
box("site-bed", 24, 0.18, 18, soil, 0, 0.02, 0, site);
const curbMat = new THREE.MeshStandardMaterial({ color: 0x8b806d, roughness: 0.92 });
box("front-curb", 25, 0.3, 0.35, curbMat, 0, 0.12, 9.1, site);
box("left-curb", 0.35, 0.3, 18, curbMat, -12.3, 0.12, 0, site);
box("right-curb", 0.35, 0.3, 18, curbMat, 12.3, 0.12, 0, site);
const stakeMat = new THREE.MeshStandardMaterial({ color: 0x504739, roughness: 0.8 });
for (const x of [-9.3, -6, 0, 6, 9.3]) {
  const stake = box(`survey-stake-${x}`, 0.07, 0.7, 0.07, stakeMat, x, 0.35, -5.9);
  stake.visible = false;
}

// A calm reflecting pool anchors the foreground without interrupting the construction.
const poolBed = box("pool-basin", 29, 0.35, 7.8, curbMat, 0, -0.08, 12.7);
const poolSurface = new THREE.Mesh(new THREE.PlaneGeometry(28.5, 7.45), water);
poolSurface.rotation.x = -Math.PI / 2;
poolSurface.position.set(0, 0.11, 12.7);
poolSurface.receiveShadow = true;
scene.add(poolSurface);
box("pool-edge-front", 29.3, 0.2, 0.2, limestone, 0, 0.18, 16.55);
box("pool-edge-back", 29.3, 0.2, 0.2, limestone, 0, 0.18, 8.85);

function addTree(x, z, height, seed) {
  const rand = seeded(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.43, height * 0.68, 10), bark);
  trunk.position.y = height * 0.34;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);
  for (let b = 0; b < 4; b++) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.13, height * 0.34, 7), bark);
    branch.position.set((rand() - 0.5) * 1.8, height * (0.54 + rand() * 0.14), (rand() - 0.5) * 1.1);
    branch.rotation.z = (rand() - 0.5) * 0.9;
    branch.rotation.x = (rand() - 0.5) * 0.7;
    branch.castShadow = true;
    group.add(branch);
  }
  for (let i = 0; i < 22; i++) {
    const size = 0.65 + rand() * 0.9;
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), foliage);
    leaves.position.set((rand() - 0.5) * 5.2, height * (0.7 + rand() * 0.34), (rand() - 0.5) * 4.2);
    leaves.scale.set(1.05 + rand() * 0.6, 0.65 + rand() * 0.5, 0.9 + rand() * 0.6);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    group.add(leaves);
  }
  return group;
}
const trees = [addTree(-15, -9, 10, 101), addTree(17, -12, 8, 303), addTree(-20, 4, 7, 505)];

// Survey markings are only visible in the first seconds of the accelerated build.
const survey = [];
for (const x of [-9.4, 9.4]) {
  for (const z of [-5.7, 5.7]) {
    const marker = box("survey-cross", 0.9, 0.025, 0.035, darkBronze, x, 0.16, z);
    survey.push(marker);
    const markerCross = box("survey-crossbar", 0.035, 0.025, 0.9, darkBronze, x, 0.16, z);
    survey.push(markerCross);
  }
}

const building = new THREE.Group();
scene.add(building);
const foundationSlabs = [];
for (const x of [-4.55, 4.55]) {
  for (const z of [-2.78, 2.78]) {
    const slab = box("poured-foundation", 9.05, 0.64, 5.5, concrete, x, 0.32, z, building);
    foundationSlabs.push({ mesh: slab, start: 4.0 + (x > 0 ? 0.24 : 0) + (z > 0 ? 0.13 : 0) });
  }
}

function cylinderRod(name, x, y, z, length, direction, radius = 0.035, material = rebarMaterial) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (direction === "x") mesh.rotation.z = Math.PI / 2;
  if (direction === "z") mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);
  return mesh;
}
const slabRebar = [];
for (let z = -4.65; z <= 4.66; z += 1.32) slabRebar.push({ mesh: cylinderRod("slab-rebar-x", 0, 0.83, z, 18.1, "x", 0.034), axis: "x" });
for (let x = -8.9; x <= 8.91; x += 1.35) slabRebar.push({ mesh: cylinderRod("slab-rebar-z", x, 0.86, 0, 10.6, "z", 0.034), axis: "z" });

const xs = [-6, 0, 6];
const zs = [-3.55, 3.55];
const columnBases = [];
for (const x of xs) for (const z of zs) columnBases.push([x, z]);
const cages = [];
const columns = [];
const floorBase = 0.63;
function addColumnCage(x, z, base, height, start, end, tag) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  for (const dx of [-0.2, 0.2]) for (const dz of [-0.2, 0.2]) {
    const rod = box(`${tag}-vertical-rebar`, 0.055, height, 0.055, rebarMaterial, dx, base + height / 2, dz, group);
    cages.push({ mesh: rod, start, end, base, height });
  }
  for (let y = 0.3; y < height; y += 0.34) {
    const hoop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.5), rebarMaterial);
    hoop.position.set(0, base + y, 0);
    group.add(hoop);
    cages.push({ mesh: hoop, start, end, base: base + y, height: 0.035, hoop: true });
  }
  const column = box(`${tag}-concrete-column`, 0.48, height, 0.48, concrete, x, base + height / 2, z, building);
  columns.push({ mesh: column, start: end - 0.15, end: end + 1.8, base, height });
}
for (const [x, z] of columnBases) addColumnCage(x, z, floorBase, 3.65, 7.6 + (x + 6) * 0.03, 9.25 + Math.abs(z) * 0.03, "ground-column");
const upperBase = 4.55;
for (const [x, z] of columnBases) addColumnCage(x, z, upperBase, 3.0, 19.1 + (x + 6) * 0.025, 20.6 + Math.abs(z) * 0.03, "upper-column");

const beams = [];
function addBeam(x, y, z, width, height, depth, start, axis, material = concrete, name = "structural-beam") {
  const mesh = box(name, width, height, depth, material, x, y, z, building);
  const offset = axis === "x" ? { x: -Math.sign(x || 1) * 9, z: 0 } : { x: 0, z: 9 };
  beams.push({ mesh, start, end: start + 1.15, target: [x, y, z], offset });
  return mesh;
}
for (const y of [4.28, 8.12]) {
  const start = y < 5 ? 13.5 : 22.0;
  for (const z of zs) for (const x of [-3, 3]) addBeam(x, y, z, 6.1, 0.48, 0.46, start + (x > 0 ? 0.55 : 0) + (z > 0 ? 0.18 : 0), "x");
  for (const x of xs) for (const z of [0]) addBeam(x, y, z, 0.46, 0.48, 7.25, start + (x + 6) * 0.08, "z");
}

const upperSlab = box("upper-floor-slab", 18.1, 0.42, 11.1, concrete, 0, 4.48, 0, building);
const upperSlabSupport = 18.1;
const walls = [];
function addWall(name, w, h, d, x, base, z, start, material = limestone) {
  const mesh = box(name, w, h, d, material, x, base + h / 2, z, building);
  walls.push({ mesh, start, end: start + 1.6, base, height: h });
  return mesh;
}
for (const base of [0.72, 4.95]) {
  const start = base < 1 ? 22.8 : 25.3;
  const h = base < 1 ? 3.12 : 2.75;
  addWall("rear-limestone-wall", 17.3, h, 0.28, 0, base, -5.25, start, limestone);
  addWall("left-return-wall", 0.28, h, 10.1, -8.8, base, 0, start + 0.2, limestone);
  addWall("right-return-wall", 0.28, h, 10.1, 8.8, base, 0, start + 0.55, limestone);
  // Front stone returns leave clear openings for full-height bronze glazing.
  addWall("front-left-pier", 2.4, h, 0.34, -7.6, base, 5.18, start + 0.45, limestone);
  addWall("front-right-pier", 2.4, h, 0.34, 7.6, base, 5.18, start + 0.7, limestone);
  addWall("front-central-pier", 2.6, h, 0.34, 0, base, 5.18, start + 0.95, limestone);
}
const partitions = [];
for (const base of [0.73, 4.96]) {
  const h = base < 1 ? 2.65 : 2.2;
  const start = base < 1 ? 24.5 : 26;
  partitions.push(addWall("interior-partition", 0.2, h, 4.4, -2.6, base, -2.4, start, limestone));
  partitions.push(addWall("interior-partition", 0.2, h, 3.3, 2.9, base, -2.8, start + 0.45, limestone));
}

const glazing = [];
const mullions = [];
function addGlazingLevel(base, h, start) {
  for (const x of [-4.9, -1.65, 1.65, 4.9]) {
    const pane = new THREE.Mesh(new THREE.BoxGeometry(3.1, h, 0.055), glass);
    pane.position.set(x, base + h / 2, 5.0);
    pane.receiveShadow = true;
    scene.add(pane);
    glazing.push({ mesh: pane, start, end: start + 1.1, base, h });
    const frame = [
      box("bronze-window-jamb", 0.09, h, 0.11, darkBronze, x - 1.5, base + h / 2, 5.04),
      box("bronze-window-jamb", 0.09, h, 0.11, darkBronze, x + 1.5, base + h / 2, 5.04),
      box("bronze-window-head", 3.1, 0.085, 0.11, darkBronze, x, base + h, 5.04),
      box("bronze-window-sill", 3.1, 0.085, 0.11, darkBronze, x, base, 5.04),
    ];
    frame.forEach((mesh) => mullions.push({ mesh, start: start + 0.05, end: start + 0.9, base, height: h }));
  }
}
addGlazingLevel(0.77, 2.8, 23.8);
addGlazingLevel(4.98, 2.55, 25.0);

const woodCladding = [];
for (const base of [0.75, 4.98]) {
  for (const x of [-7.55, 7.55]) {
    const panel = box("teak-slat-facade", 1.45, base < 1 ? 2.8 : 2.5, 0.12, teak, x, base + (base < 1 ? 1.4 : 1.25), 5.28, building);
    woodCladding.push({ mesh: panel, start: base < 1 ? 26.5 : 27.3, end: base < 1 ? 28.2 : 29, base, height: base < 1 ? 2.8 : 2.5 });
  }
}

const furniture = [];
function furnitureBox(name, w, h, d, material, x, y, z, start) {
  const mesh = box(name, w, h, d, material, x, y, z);
  furniture.push({ mesh, start, end: start + 0.85, base: y - h / 2, height: h });
  return mesh;
}
const upholstery = new THREE.MeshStandardMaterial({ color: 0xb9ad98, roughness: 0.93 });
const upholsteryDark = new THREE.MeshStandardMaterial({ color: 0x817561, roughness: 0.9 });
const furnitureStart = 26;
furnitureBox("living-room-sofa-base", 3.2, 0.52, 1.05, upholsteryDark, -3.35, 0.55, -1.0, furnitureStart);
furnitureBox("living-room-sofa-cushion", 3.1, 0.35, 1.0, upholstery, -3.35, 0.96, -1.0, furnitureStart + 0.1);
furnitureBox("sofa-back", 3.2, 0.9, 0.22, upholstery, -3.35, 1.28, -1.42, furnitureStart + 0.2);
furnitureBox("coffee-table", 2.0, 0.14, 0.9, teak, -3.25, 0.45, 0.65, furnitureStart + 0.25);
furnitureBox("dining-table-top", 2.3, 0.12, 1.0, teak, 4.2, 1.55, -1.1, furnitureStart + 0.4);
for (const x of [3.35, 5.05]) for (const z of [-1.9, -0.3]) {
  furnitureBox("dining-chair-seat", 0.58, 0.12, 0.58, darkBronze, x, 1.0, z, furnitureStart + 0.55);
  furnitureBox("dining-chair-back", 0.58, 0.82, 0.12, teak, x, 1.42, z - 0.22, furnitureStart + 0.62);
}
for (const x of [-4.5, 4.5]) {
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), interiorLight);
  lamp.position.set(x, 3.35, -4.95);
  scene.add(lamp);
  lamp.visible = false;
  furniture.push({ mesh: lamp, start: 27, end: 28.2, base: 3.2, height: 0.3 });
  const light = new THREE.PointLight(0xffb75f, 0, 5.5);
  light.position.copy(lamp.position);
  scene.add(light);
  light.userData.start = 27;
  light.userData.end = 29;
}

const roofBeams = [];
for (let z = -5; z <= 5.01; z += 2.5) {
  const mesh = box("roof-timber-rafter", 18.8, 0.22, 0.24, teak, 0, 8.25, z, building);
  roofBeams.push({ mesh, start: 28.0 + (z + 5) * 0.08, end: 29.6 + (z + 5) * 0.08, x: 0, y: 8.25, z, offset: [0, 3.5, -3] });
}
for (let x = -8; x <= 8.01; x += 4) {
  const mesh = box("roof-transverse-beam", 0.24, 0.3, 12, darkBronze, x, 8.42, 0, building);
  roofBeams.push({ mesh, start: 29.0 + Math.abs(x) * 0.035, end: 30.25 + Math.abs(x) * 0.035, x, y: 8.42, z: 0, offset: [Math.sign(x || 1) * 4, 2, 0] });
}
const roofPanels = [];
for (const x of [-7.5, -2.5, 2.5, 7.5]) {
  const panel = box("roof-stone-panel", 4.95, 0.48, 12.8, limestone, x, 8.76, 0, building);
  roofPanels.push({ mesh: panel, x, start: 30.2 + (x + 7.5) * 0.07, end: 33.2 + (x + 7.5) * 0.07, startY: 13.8, targetY: 8.76, zOffset: x < 0 ? -2 : 2 });
}
const roofEdge = box("cantilever-roof-edge", 20.3, 0.25, 0.38, darkBronze, 0, 8.95, 6.25, building);
const roofEdges = [roofEdge];
for (const x of [-9.9, 9.9]) roofEdges.push(box("roof-side-edge", 0.23, 0.24, 12.9, darkBronze, x, 8.92, 0, building));

const houseLights = scene.children.filter((node) => node.isPointLight);

const dustRand = seeded(4301);
const dustPositions = new Float32Array(150 * 3);
const dustSeeds = [];
for (let i = 0; i < 150; i++) {
  const x = (dustRand() - 0.5) * 22;
  const y = 0.7 + dustRand() * 8.8;
  const z = (dustRand() - 0.5) * 18;
  dustPositions[i * 3] = x; dustPositions[i * 3 + 1] = y; dustPositions[i * 3 + 2] = z;
  dustSeeds.push([x, y, z, dustRand() * 6.2, 0.3 + dustRand() * 0.8]);
}
const dustGeometry = new THREE.BufferGeometry();
dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xf0d9a8, size: 0.045, transparent: true, opacity: 0.36, sizeAttenuation: true }));
scene.add(dust);

const cameraKeys = [
  [0, [0, 5.2, 34], [0, 2.2, 0]],
  [5, [0, 3.0, 19], [0, 2.2, 0]],
  [11, [-4.2, 4.0, 8.5], [0, 3.5, 0]],
  [16, [-5.8, 8.0, 10], [-1.8, 5.5, 0]],
  [21, [2.4, 8.5, 18], [0, 4.5, 0]],
  [28, [-2.2, 10.5, 14], [0, 7.4, 0]],
  [34, [0.5, 13.0, 17], [0, 4.0, 0]],
  [40, [23, 16.5, 32], [0, 4.1, 0]],
];
function pathAt(keys, time, vectorIndex) {
  let segment = 0;
  while (segment < keys.length - 2 && time > keys[segment + 1][0]) segment++;
  const [t1] = keys[segment];
  const [t2] = keys[segment + 1];
  const v0 = keys[Math.max(0, segment - 1)][vectorIndex];
  const v1 = keys[segment][vectorIndex];
  const v2 = keys[segment + 1][vectorIndex];
  const v3 = keys[Math.min(keys.length - 1, segment + 2)][vectorIndex];
  const u = THREE.MathUtils.clamp((time - t1) / (t2 - t1), 0, 1);
  const point = new THREE.Vector3();
  for (const [axis, index] of [["x", 0], ["y", 1], ["z", 2]]) {
    const p0 = v0[index], p1 = v1[index], p2 = v2[index], p3 = v3[index];
    point[axis] = 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
  }
  return point;
}

function moveAt(keys, time) {
  let i = 0;
  while (i < keys.length - 2 && time > keys[i + 1][0]) i++;
  const [t0, from] = keys[i];
  const [t1, to] = keys[i + 1];
  const p = ease01((time - t0) / (t1 - t0));
  return from + (to - from) * p;
}

const slabSections = [];
const firstFloorSlab = box("first-floor-slab", 18.1, 0.46, 11.1, concrete, 0, 4.48, 0, building);
slabSections.push({ mesh: firstFloorSlab, start: 17.7, end: 20.2, base: 4.25, height: 0.46 });
slabSections.push({ mesh: upperSlab, start: upperSlabSupport, end: 24.5, base: 4.27, height: 0.42 });

function renderAt(time) {
  const t = THREE.MathUtils.clamp(time, 0, DURATION);
  // Construction phase 1: exposed steel cage, then a segmented concrete pour.
  survey.forEach((marker) => { marker.visible = t < 6.2; });
  slabRebar.forEach(({ mesh }) => { const p = progress(t, 2.0, 4.3); mesh.visible = t >= 2.0 && t < 5.5; mesh.scale.y = Math.max(0.001, p); });
  foundationSlabs.forEach(({ mesh, start }) => { const p = progress(t, start, start + 1.25); mesh.scale.y = Math.max(0.001, p); mesh.position.y = 0.32 * p; mesh.visible = t >= start; });

  // Rebar rises first; concrete columns then climb from the poured foundation.
  cages.forEach(({ mesh, start, end, base, height, hoop }) => {
    const p = progress(t, start, end);
    mesh.visible = t >= start && (hoop ? t < end + 0.5 : t < end + 0.25);
    if (hoop) { mesh.scale.setScalar(Math.max(0.001, p)); mesh.position.y = base; }
    else { mesh.scale.y = Math.max(0.001, p); mesh.position.y = base + height * p / 2; }
  });
  columns.forEach(({ mesh, start, end, base, height }) => verticalBuild(mesh, t, start, end, base, height));

  beams.forEach(({ mesh, start, end, target, offset }) => {
    const p = progress(t, start, end);
    mesh.visible = t >= start;
    mesh.position.set(target[0] + offset.x * (1 - p), target[1], target[2] + offset.z * (1 - p));
  });
  slabSections.forEach(({ mesh, start, end, base, height }) => verticalBuild(mesh, t, start, end, base, height));
  walls.forEach(({ mesh, start, end, base, height }) => verticalBuild(mesh, t, start, end, base, height));
  glazing.forEach(({ mesh, start, end }) => { const p = progress(t, start, end); mesh.visible = t >= start; mesh.material.opacity = 0.54 * p; });
  mullions.forEach(({ mesh, start, end, base, height }) => verticalBuild(mesh, t, start, end, base, height));
  woodCladding.forEach(({ mesh, start, end, base, height }) => verticalBuild(mesh, t, start, end, base, height));
  furniture.forEach(({ mesh, start, end, base, height }) => verticalBuild(mesh, t, start, end, base, height));
  houseLights.forEach((light) => { const p = progress(t, light.userData.start, light.userData.end); light.intensity = 7 * p; });
  roofBeams.forEach(({ mesh, start, end, x, y, z, offset }) => {
    const p = progress(t, start, end);
    mesh.visible = t >= start;
    mesh.position.set(x + offset[0] * (1 - p), y + offset[1] * (1 - p), z + offset[2] * (1 - p));
  });
  roofPanels.forEach(({ mesh, x, start, end, startY, targetY, zOffset }) => {
    const p = progress(t, start, end);
    mesh.visible = t >= start;
    mesh.position.set(x, startY + (targetY - startY) * p, zOffset * (1 - p));
  });
  roofEdges.forEach((mesh) => { mesh.visible = t >= 32.5; });

  const point = pathAt(cameraKeys, t, 1);
  const target = pathAt(cameraKeys, t, 2);
  camera.position.copy(point);
  camera.lookAt(target);
  camera.fov = moveAt([[0, 42], [13, 35], [18, 39], [30, 37], [40, 44]], t);
  camera.updateProjectionMatrix();

  const positions = dust.geometry.attributes.position.array;
  dustSeeds.forEach(([x, y, z, phase, speed], i) => {
    positions[i * 3] = x + Math.sin(t * speed * 0.22 + phase) * 0.2;
    positions[i * 3 + 1] = y + ((t * speed * 0.14 + phase) % 1.8);
    positions[i * 3 + 2] = z + Math.cos(t * speed * 0.18 + phase) * 0.18;
  });
  dust.geometry.attributes.position.needsUpdate = true;
  dust.visible = t > 3.5 && t < 35;
  renderer.render(scene, camera);
}

const motion = { time: 0 };
const timeline = gsap.timeline({ paused: true });
timeline.to(motion, { time: DURATION, duration: DURATION, ease: "none", onUpdate: () => renderAt(motion.time) }, 0);
const reveal = (selector, at, duration = 0.55, y = 16) => timeline.fromTo(selector, { opacity: 0, y }, { opacity: 1, y: 0, duration, ease: "power2.out" }, at);
const fade = (selector, at, duration = 0.3) => timeline.to(selector, { opacity: 0, duration, ease: "power1.in" }, at);
reveal("#opening", 0.65, 0.8, 20); fade("#opening", 3.2);
reveal("#foundation-copy", 6.5, 0.55); fade("#foundation-copy", 9.15);
reveal("#pillar-copy", 10.25, 0.5); fade("#pillar-copy", 14.15);
reveal("#beam-copy", 21.0, 0.55); fade("#beam-copy", 23.8);
reveal("#logic-but", 15.0, 0.26, 7); fade("#logic-but", 16.0, 0.18);
reveal("#logic-however", 16.35, 0.26, 7); fade("#logic-however", 17.35, 0.18);
reveal("#logic-therefore", 17.7, 0.26, 7); fade("#logic-therefore", 18.7, 0.18);
reveal("#logic-instead", 19.05, 0.26, 7); fade("#logic-instead", 20.05, 0.18);
reveal("#room-copy", 25.0, 0.55); fade("#room-copy", 28.5);
reveal("#roof-copy", 32.0, 0.55); fade("#roof-copy", 35.2);
timeline.fromTo("#end-shade", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 35.25);
reveal("#final-sequence", 36.0, 0.55, 10);
reveal("#endline", 36.65, 0.6, 10);
timeline.fromTo("#brand-mark", { opacity: 0, y: 8 }, { opacity: 0.9, y: 0, duration: 0.7, ease: "power2.out" }, 38.25);

window.__timelines = window.__timelines || {};
window.__timelines.main = timeline;
renderAt(0);
window.__hf.resolveArchitecture();
