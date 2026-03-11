// --- 1. DATA & STATE ---
let stats = { money: 0, mult: 5, rebirths: 0, workers: 0, wPrice: 25 };
let isMenuOpen = false, isHarvesting = false;
let velocityY = 0, isGrounded = true;
let player = { x: 0, z: 10, y: 0, yaw: 0 }; // y will be calculated based on ground
let keys = {};

function save() { localStorage.setItem('TreeSim_v5', JSON.stringify(stats)); }
function load() {
    const d = localStorage.getItem('TreeSim_v5');
    if(d) { stats = JSON.parse(d); updateUI(); }
}

// --- 2. WORLD (Real Hills Geometry) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(50, 150, 50); scene.add(sun);

// Hill Generation Function
function getGroundHeight(x, z) {
    // This formula MUST match the ground geometry math below
    return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 6;
}

const groundGeo = new THREE.PlaneGeometry(1000, 1000, 100, 100);
const vertices = groundGeo.attributes.position;
for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const y = vertices.getY(i);
    vertices.setZ(i, getGroundHeight(x, y)); 
}
groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x3d8c40, flatShading: false }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// --- 3. IMPROVED TREES (Branches + Randomization) ---
let trees = [];
function createTree(x, z) {
    const group = new THREE.Group();
    const scale = 0.6 + Math.random() * 2.0;
    const gHeight = getGroundHeight(x, z);

    // Trunk
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 7),
        new THREE.MeshStandardMaterial({ color: 0x5d4037 })
    );
    trunk.position.y = 3.5;
    group.add(trunk);

    // Branches
    for(let i=0; i<4; i++) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 4), new THREE.MeshStandardMaterial({color: 0x5d4037}));
        b.position.y = 3 + i;
        b.rotation.z = 1 + Math.random();
        b.rotation.y = (i * Math.PI) / 2;
        group.add(b);
    }

    // Leaves
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2e7d32 }));
    leaves.position.y = 8;
    group.add(leaves);

    group.scale.set(scale, scale, scale);
    group.position.set(x, gHeight, z); // Set tree base to ground height
    scene.add(group);
    return { obj: group, x, z, scale };
}

for(let i=0; i<120; i++) {
    let tx = (Math.random()-0.5)*800;
    let tz = (Math.random()-0.5)*800;
    trees.push(createTree(tx, tz));
}

// --- 4. INPUTS ---
window.addEventListener("mousedown", () => { if(!isMenuOpen) renderer.domElement.requestPointerLock(); });
document.addEventListener("mousemove", (e) => {
    if(document.pointerLockElement === renderer.domElement) {
        player.yaw -= e.movementX * 0.003;
        camera.rotation.set(0, player.yaw, 0);
    }
});

document.addEventListener("keydown", e => {
    const k = e.key.toLowerCase(); keys[k] = true;
    if(k === ' ' && isGrounded) { 
        velocityY = 0.4; // Jump Strength
        isGrounded = false; 
    }
    if(k === 'k') { player.x = 0; player.z = -50; }
    if(k === 'e' || k === 'p') {
        isMenuOpen = true;
        document.getElementById(k === 'e' ? 'store-gui' : 'settings-gui').style.display = 'block';
        document.exitPointerLock();
    }
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// --- 5. THE ENGINE (The "Floating" Fix) ---
function update() {
    if(isMenuOpen) return;

    let speed = keys["shift"] ? 1.4 : 0.7;
    if(keys["w"]) { player.x -= Math.sin(player.yaw) * speed; player.z -= Math.cos(player.yaw) * speed; }
    if(keys["s"]) { player.x += Math.sin(player.yaw) * speed; player.z += Math.cos(player.yaw) * speed; }
    if(keys["a"]) { player.x -= Math.cos(player.yaw) * speed; player.z += Math.sin(player.yaw) * speed; }
    if(keys["d"]) { player.x += Math.cos(player.yaw) * speed; player.z -= Math.sin(player.yaw) * speed; }

    // BORDER LIMIT
    const dist = Math.sqrt(player.x**2 + player.z**2);
    if(dist > 450) { player.x *= 0.9; player.z *= 0.9; }

    // PHYSICS & HEIGHT DETECTION
    const currentGround = getGroundHeight(player.x, player.z);
    
    player.y += velocityY;
    
    // Check if player is on or below the hill height
    if(player.y <= currentGround + 6) { // 6 is player eye level
        player.y = currentGround + 6;
        velocityY = 0;
        isGrounded = true;
    } else {
        velocityY -= 0.02; // Gravity
        isGrounded = false;
    }

    camera.position.set(player.x, player.y, player.z);

    // HARVESTING LOGIC
    if(!isHarvesting) {
        trees.forEach(t => {
            const d = Math.sqrt((player.x - t.x)**2 + (player.z - t.z)**2);
            if(d < 7 * t.scale) {
                isHarvesting = true;
                stats.money += stats.mult;
                updateUI(); save();
                
                // Respawn Tree
                t.x = (Math.random()-0.5)*800;
                t.z = (Math.random()-0.5)*800;
                t.obj.position.set(t.x, getGroundHeight(t.x, t.z), t.z);
                
                setTimeout(() => { isHarvesting = false; }, 200);
            }
        });
    }
}

function updateUI() { 
    document.getElementById('money').innerText = Math.floor(stats.money); 
}

function animate() { requestAnimationFrame(animate); update(); renderer.render(scene, camera); }
load(); animate();
