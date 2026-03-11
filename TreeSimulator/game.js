// --- 1. DATA & SAVING ---
let stats = { money: 0, mult: 5, rebirths: 0, workers: 0, wPrice: 25, aPrice: 100 };

function save() { localStorage.setItem('EchoDupe_Galactic_Save', JSON.stringify(stats)); }
function load() {
    const data = localStorage.getItem('EchoDupe_Galactic_Save');
    if (data) {
        stats = JSON.parse(data);
        updateUI();
        for(let i=0; i < stats.workers; i++) spawnBot(true);
    }
}

// --- 2. THE WORLD (Bright & Fixed) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1a1a); // Lighter sky
scene.fog = new THREE.Fog(0x0a1a1a, 10, 250);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHTING FIX: High intensity to stop the "Too Dark" issue
const ambient = new THREE.AmbientLight(0xffffff, 1.2); 
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(50, 100, 50);
scene.add(sun);

// Ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x113311, roughness: 1 })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// --- 3. TREE FIX (Visible Trunks) ---
let trees = [];
function createTree(x, z) {
    const group = new THREE.Group();
    
    // The Trunk (Bottom part) - Adjusted height and position
    const trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 4);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4d2600 }); // Deep brown
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2; // Sits on ground
    group.add(trunk);

    // The Leaves (Top part)
    const leafGeo = new THREE.ConeGeometry(3.5, 10, 8);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x00ff44 });
    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.y = 8; 
    group.add(leaves);

    group.position.set(x, 0, z);
    scene.add(group);
    return { obj: group, x, z };
}

// Spawn 70 fixed trees
for(let i=0; i<70; i++) {
    trees.push(createTree((Math.random()-0.5)*260, (Math.random()-0.5)*260));
}

// --- 4. CONTROLS (Simple & Direct) ---
let player = { x: 0, z: 20, yaw: 0 };
let keys = {};

// Click anywhere to lock mouse and look around
window.addEventListener("mousedown", () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        player.yaw -= e.movementX * 0.003;
        camera.rotation.set(0, player.yaw, 0);
    }
});

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if(e.key.toLowerCase() === 'k') { player.x = 0; player.z = -30; } // TP Shop
    if(e.key.toLowerCase() === 'p') document.getElementById('settings-gui').style.display='block';
    if(e.key.toLowerCase() === 'e') {
        if(Math.sqrt(player.x**2 + (player.z + 60)**2) < 20) {
            document.getElementById('store-gui').style.display='block';
            document.exitPointerLock();
        }
    }
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// --- 5. DRONES & INCOME ---
let bots = [];
function spawnBot(loading = false) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshStandardMaterial({color: 0x00ffff, wireframe: true}));
    b.position.set((Math.random()-0.5)*40, 6, (Math.random()-0.5)*40);
    scene.add(b); bots.push(b);
    if(!loading) save();
}

function updateUI() {
    document.getElementById('money').innerText = Math.floor(stats.money);
    document.getElementById('rebirths').innerText = stats.rebirths;
}

setInterval(() => {
    if(stats.workers > 0) {
        stats.money += (stats.workers * (stats.rebirths + 1));
        updateUI(); save();
    }
}, 1000);

// --- 6. MAIN ENGINE ---
function update() {
    let speed = keys["shift"] ? 1.0 : 0.5;
    if(keys["w"]) { player.x -= Math.sin(player.yaw) * speed; player.z -= Math.cos(player.yaw) * speed; }
    if(keys["s"]) { player.x += Math.sin(player.yaw) * speed; player.z += Math.cos(player.yaw) * speed; }
    if(keys["a"]) { player.x -= Math.cos(player.yaw) * speed; player.z += Math.sin(player.yaw) * speed; }
    if(keys["d"]) { player.x += Math.cos(player.yaw) * speed; player.z -= Math.sin(player.yaw) * speed; }

    // Collision with world edge
    player.x = Math.max(-145, Math.min(145, player.x));
    player.z = Math.max(-145, Math.min(145, player.z));
    camera.position.set(player.x, 5, player.z);

    // Harvest logic
    trees.forEach(t => {
        if(Math.sqrt((player.x - t.x)**2 + (player.z - t.z)**2) < 5) {
            stats.money += stats.mult; updateUI(); save();
            t.x = (Math.random()-0.5)*260; t.z = (Math.random()-0.5)*260;
            t.obj.position.set(t.x, 0, t.z);
        }
    });

    bots.forEach(b => { b.rotation.y += 0.05; b.position.y = 6 + Math.sin(Date.now()*0.003); });
}

function animate() { requestAnimationFrame(animate); update(); renderer.render(scene, camera); }

load();
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
