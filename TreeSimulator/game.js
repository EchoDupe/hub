// --- 1. DATA & SAVING ---
let stats = {
    money: 0,
    mult: 5,
    rebirths: 0,
    workers: 0,
    wPrice: 25,
    aPrice: 100
};

function saveGame() {
    localStorage.setItem('EchoDupe_TreeSim_Save', JSON.stringify(stats));
}

function loadGame() {
    const saved = localStorage.getItem('EchoDupe_TreeSim_Save');
    if (saved) {
        stats = JSON.parse(saved);
        updateUI();
        for(let i=0; i<stats.workers; i++) spawnBot(true); // Restore bots
    }
}

// --- 2. SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000105);
scene.fog = new THREE.FogExp2(0x000105, 0.01);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Stars
const starGeo = new THREE.BufferGeometry();
const starCoords = [];
for(let i=0; i<1500; i++) {
    starCoords.push((Math.random()-0.5)*800, Math.random()*400, (Math.random()-0.5)*800);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color: 0xffffff, size: 0.7})));

// --- 3. WORLD OBJECTS ---
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x051a05, roughness: 1 })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// Border (Physical Wall)
const wallMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
function makeWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 8, d), wallMat);
    wall.position.set(x, 4, z); scene.add(wall);
}
makeWall(0, 150, 300, 2); makeWall(0, -150, 300, 2);
makeWall(150, 0, 2, 300); makeWall(-150, 0, 2, 300);

// Shop Building
const shop = new THREE.Group();
const bld = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 15), new THREE.MeshStandardMaterial({color: 0x0a0a0a}));
const neonRing = new THREE.Mesh(new THREE.TorusGeometry(8, 0.2, 16, 100), new THREE.MeshBasicMaterial({color: 0x00ffff}));
neonRing.rotation.x = Math.PI/2; neonRing.position.y = 5.1;
shop.add(bld, neonRing); shop.position.set(0, 5, -50); scene.add(shop);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.PointLight(0x00ffff, 2, 100);
sun.position.set(0, 20, -50); scene.add(sun);

// --- 4. GAMEPLAY ELEMENTS ---
let trees = [];
function createTree(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 4), new THREE.MeshStandardMaterial({color: 0x221100}));
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.5, 7, 6), new THREE.MeshStandardMaterial({color: 0x002200, emissive: 0x001100}));
    leaves.position.y = 4; g.add(trunk, leaves);
    g.position.set(x, 0, z); scene.add(g);
    return { obj: g, x, z };
}
for(let i=0; i<60; i++) trees.push(createTree((Math.random()-0.5)*260, (Math.random()-0.5)*260));

let bots = [];
function spawnBot(isLoading = false) {
    const bot = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshStandardMaterial({color: 0x00ffff, wireframe: true}));
    bot.position.set((Math.random()-0.5)*20, 5, (Math.random()-0.5)*20);
    scene.add(bot);
    bots.push(bot);
    if(!isLoading) saveGame();
}

// --- 5. INPUT & MOVEMENT ---
let player = { x: 0, z: 20, yaw: 0 };
let keys = {};
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    // Hotkeys
    if(e.key.toLowerCase() === 'e') {
        if(Math.sqrt(player.x**2 + (player.z + 50)**2) < 20) document.getElementById('store-gui').style.display='block';
    }
    if(e.key.toLowerCase() === 'k') { player.x = 0; player.z = -30; }
    if(e.key.toLowerCase() === 'p') document.getElementById('settings-gui').style.display='block';
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
document.addEventListener("mousemove", e => {
    if(document.pointerLockElement) {
        player.yaw -= e.movementX * 0.002;
        camera.rotation.set(0, player.yaw, 0);
    }
});

document.body.onclick = () => {
    if(document.getElementById('store-gui').style.display === 'none') {
        document.body.requestPointerLock();
        document.getElementById('prompt').style.opacity = '0';
    }
};

// --- 6. LOGIC FUNCTIONS ---
window.buyWorker = function() {
    if(stats.money >= stats.wPrice) {
        stats.money -= stats.wPrice;
        stats.workers++;
        spawnBot();
        stats.wPrice = Math.floor(stats.wPrice * 1.8);
        updateUI();
    }
};

window.buyAxe = function() {
    if(stats.money >= stats.aPrice) {
        stats.money -= stats.aPrice;
        stats.mult *= 2;
        stats.aPrice *= 5;
        updateUI();
        saveGame();
    }
};

window.doRebirth = function() {
    if(stats.money >= 5000) {
        stats.money = 0;
        stats.rebirths++;
        stats.mult = 5 * (stats.rebirths + 1);
        stats.workers = 0;
        stats.wPrice = 25;
        stats.aPrice = 100;
        bots.forEach(b => scene.remove(b));
        bots = [];
        updateUI();
        saveGame();
    }
};

window.resetSave = function() {
    localStorage.removeItem('EchoDupe_TreeSim_Save');
    location.reload();
};

function updateUI() {
    document.getElementById('money').innerText = Math.floor(stats.money);
    document.getElementById('rebirths').innerText = stats.rebirths;
    document.getElementById('w-cost').innerText = stats.wPrice;
    document.getElementById('a-cost').innerText = stats.aPrice;
}

// Fixed Income Timer (Once per second)
setInterval(() => {
    if(stats.workers > 0) {
        stats.money += (stats.workers * (stats.rebirths + 1) * 2);
        updateUI();
        saveGame();
    }
}, 1000);

function update() {
    let speed = keys["shift"] ? 0.9 : 0.45;
    if(keys["w"]) { player.x -= Math.sin(player.yaw) * speed; player.z -= Math.cos(player.yaw) * speed; }
    if(keys["s"]) { player.x += Math.sin(player.yaw) * speed; player.z += Math.cos(player.yaw) * speed; }
    if(keys["a"]) { player.x -= Math.cos(player.yaw) * speed; player.z += Math.sin(player.yaw) * speed; }
    if(keys["d"]) { player.x += Math.cos(player.yaw) * speed; player.z -= Math.sin(player.yaw) * speed; }

    // Hard Border
    player.x = Math.max(-145, Math.min(145, player.x));
    player.z = Math.max(-145, Math.min(145, player.z));
    camera.position.set(player.x, 4, player.z);

    // Tree Logic
    trees.forEach(t => {
        if(Math.sqrt((player.x - t.x)**2 + (player.z - t.z)**2) < 4) {
            stats.money += stats.mult;
            updateUI();
            saveGame();
            t.x = (Math.random()-0.5)*260; t.z = (Math.random()-0.5)*260;
            t.obj.position.set(t.x, 0, t.z);
        }
    });

    // Bot Hover Animation
    bots.forEach(b => { b.rotation.y += 0.02; b.position.y = 5 + Math.sin(Date.now()*0.003); });
}

function animate() { requestAnimationFrame(animate); update(); renderer.render(scene, camera); }

// Start Game
loadGame();
animate();

window.onresize = () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
