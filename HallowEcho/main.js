/**
 * HORROR GAME: THE HOUSE UPDATE
 * Controls: WASD (Move), SHIFT (Sprint), F (Flashlight), E/Click (Interact), P (Settings)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. ASSETS ---
const assets = {
    folder: 'assets/textures/',
    doorClosed: 'old_wooden_door.jpg',
    doorOpen: 'door_open.png',
    creature: 'creature_silhouette.png',
    sfx: {
        door: 'assets/sounds/door_open_1s.mp3',
        footstep: 'assets/sounds/footstep_wood.mp3',
        jumpscare: 'assets/sounds/jumpscare_flash.mp3'
    }
};

// --- 2. GAME SETTINGS & STATE ---
const gameSettings = { 
    sens: 0.2, 
    musicOn: true, 
    showMenu: false, 
    flashlightOn: true,
    isStunned: false // Used for jumpscare stun
};

let player = { 
    x: 300, y: 300, // Starting position inside the house
    stamina: 100,
    floor: 'floor1' 
};

let keys = {};
let mousePos = { x: 0, y: 0 };
let lightPos = { x: 0, y: 0 };
let bobStep = 0, currentBob = 0, stepTriggered = false;
let jumpscareAlpha = 0;

// Audio
const doorSfx = new Audio(assets.sfx.door);
const footstepSfx = new Audio(assets.sfx.footstep);
const jumpscareSfx = new Audio(assets.sfx.jumpscare);

// Map Objects
const door = { worldX: 400, worldY: 800, w: 150, h: 300, isOpen: false, img: new Image() };
door.img.src = assets.folder + assets.doorClosed;

const monster = { x: 1200, y: 1200, w: 200, h: 400, img: new Image(), alpha: 0 };
monster.img.src = assets.folder + assets.creature;

// --- 3. INPUTS ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyP') gameSettings.showMenu = !gameSettings.showMenu;
    if (e.code === 'KeyF' && !gameSettings.showMenu) gameSettings.flashlightOn = !gameSettings.flashlightOn;
    if (e.code === 'KeyE' && isHovering(door)) toggleDoor();
});
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousemove', (e) => { mousePos.x = e.clientX; mousePos.y = e.clientY; });
window.addEventListener('mousedown', () => { if(isHovering(door)) toggleDoor(); });

function toggleDoor() {
    doorSfx.currentTime = 0; doorSfx.play().catch(()=>{});
    door.isOpen = !door.isOpen;
    door.img.src = door.isOpen ? assets.folder + assets.doorOpen : assets.folder + assets.doorClosed;
}

function isHovering(obj) {
    let screenX = obj.worldX - player.x + canvas.width/2;
    let screenY = obj.worldY - player.y + canvas.height/2;
    return (mousePos.x > screenX && mousePos.x < screenX + obj.w &&
            mousePos.y > screenY && mousePos.y < screenY + obj.h);
}

// --- 4. COLLISION & MOVEMENT ---
function canMoveTo(newX, newY) {
    const size = MAP_SETTINGS.tileSize;
    const currentMap = houseData[player.floor];
    let col = Math.floor(newX / size);
    let row = Math.floor(newY / size);

    if (currentMap[row] && currentMap[row][col] === 1) return false; // Wall
    
    // Stairs Logic
    if (currentMap[row] && currentMap[row][col] === 'S') {
        player.floor = (player.floor === 'floor1') ? 'floor2' : 'floor1';
        player.x += 50; // Offset to prevent infinite loop
    }
    return true;
}

// --- 5. ENGINE LOGIC ---
function update() {
    if (gameSettings.showMenu || gameSettings.isStunned) return;

    let speed = (keys['ShiftLeft'] && player.stamina > 0) ? 7 : 3;
    if (speed === 7) player.stamina -= 0.6; else if (player.stamina < 100) player.stamina += 0.2;

    let moving = false;
    let nextX = player.x, nextY = player.y;

    if (keys['KeyW']) { nextY -= speed; moving = true; }
    if (keys['KeyS']) { nextY += speed; moving = true; }
    if (keys['KeyA']) { nextX -= speed; moving = true; }
    if (keys['KeyD']) { nextX += speed; moving = true; }

    if (canMoveTo(nextX, nextY)) {
        player.x = nextX;
        player.y = nextY;
    }

    // Bobbing
    if (moving) {
        bobStep += (speed === 7 ? 0.25 : 0.12);
        currentBob = Math.sin(bobStep) * (speed === 7 ? 15 : 10);
        if (currentBob < -9 && !stepTriggered) {
            footstepSfx.currentTime = 0; footstepSfx.play().catch(()=>{});
            stepTriggered = true;
        }
        if (currentBob > 0) stepTriggered = false;
    } else { currentBob *= 0.9; }

    // Flashlight Smoothing
    lightPos.x += (mousePos.x - lightPos.x) * gameSettings.sens;
    lightPos.y += (mousePos.y - lightPos.y) * gameSettings.sens;

    // Monster/Jumpscare Logic
    let dist = Math.hypot(monster.x - player.x, monster.y - player.y);
    let monSX = monster.x - player.x + canvas.width/2;

    if (dist < 800 && gameSettings.flashlightOn) {
        monster.alpha = Math.min(monster.alpha + 0.01, 1.0);
        
        // Jumpscare Trigger (Direct Look)
        if (monster.alpha > 0.8 && mousePos.x > monSX - 100 && mousePos.x < monSX + monster.w + 100) {
            triggerJumpscare();
        }
    } else { monster.alpha = Math.max(monster.alpha - 0.01, 0); }

    if (jumpscareAlpha > 0) jumpscareAlpha -= 0.05;
}

function triggerJumpscare() {
    jumpscareAlpha = 1.0;
    jumpscareSfx.play().catch(()=>{});
    gameSettings.isStunned = true;
    
    // Teleport Monster
    monster.x = player.x + (Math.random() * 1600 - 800);
    monster.y = player.y + (Math.random() * 1600 - 800);
    monster.alpha = 0;

    // Flashlight Flicker & Stun Recovery
    setTimeout(() => { gameSettings.isStunned = false; }, 1000);
    let flicker = setInterval(() => {
        gameSettings.flashlightOn = !gameSettings.flashlightOn;
    }, 50);
    setTimeout(() => { clearInterval(flicker); gameSettings.flashlightOn = true; }, 1500);
}

// --- 6. RENDER ---
function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width/2 - player.x, canvas.height/2 - player.y + currentBob);

    // Draw Map Walls
    const map = houseData[player.floor];
    ctx.fillStyle = "#1a1a1a";
    for(let r=0; r<map.length; r++) {
        for(let c=0; c<map[r].length; c++) {
            if(map[r][c] === 1) ctx.fillRect(c*200, r*200, 200, 200);
        }
    }

    // Draw Door (If on Floor 1)
    if(player.floor === 'floor1') ctx.drawImage(door.img, door.worldX, door.worldY, door.w, door.h);
    
    // Draw Monster
    if(gameSettings.flashlightOn) {
        ctx.globalAlpha = monster.alpha;
        ctx.drawImage(monster.img, monster.x, monster.y, monster.w, monster.h);
        ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    if (gameSettings.flashlightOn) drawFlashlight();
    drawUI();
    if (gameSettings.showMenu) drawMenu();

    if (jumpscareAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${jumpscareAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawFlashlight() {
    ctx.save();
    const grad = ctx.createRadialGradient(lightPos.x, lightPos.y, 10, lightPos.x, lightPos.y, 400);
    grad.addColorStop(0, 'rgba(255, 255, 200, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.99)');
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function drawUI() {
    ctx.fillStyle = isHovering(door) ? "red" : "#555";
    ctx.beginPath(); ctx.arc(mousePos.x, mousePos.y, 2, 0, Math.PI*2); ctx.fill();
    if (player.stamina < 100) {
        ctx.fillStyle = "white";
        ctx.fillRect(canvas.width/2-50, canvas.height-30, player.stamina, 4);
    }
}

function drawMenu() {
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "white"; ctx.textAlign = "center";
    ctx.font = "20px Courier New";
    ctx.fillText("PAUSED", canvas.width/2, 100);
    ctx.font = "14px Courier New";
    ctx.fillText("WASD Move | SHIFT Sprint | F Light | E Interact | P Resume", canvas.width/2, 250);
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
window.onload = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; gameLoop(); };