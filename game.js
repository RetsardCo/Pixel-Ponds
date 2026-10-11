// ============================================================
//  PIXEL FARM — A Stardew Valley Inspired 2D Browser Game
// ============================================================

// ── Constants ────────────────────────────────────────────────
const TILE = 32;
const COLS = 25;
const ROWS = 18;
const WIDTH = COLS * TILE;   // 800
const HEIGHT = ROWS * TILE;  // 576
const HUD_HEIGHT = 64;
const CANVAS_W = WIDTH;
const CANVAS_H = HEIGHT + HUD_HEIGHT;
const SCALE = 1;

// ── Tile Types ───────────────────────────────────────────────
const T = {
    GRASS: 0,
    DIRT: 1,
    WATER: 2,
    FENCE: 3,
    PATH: 4,
    TILLED: 5,
    WATERED: 6,
    PLANTED: 7,
    GROWING: 8,
    MATURE: 9,
    HOUSE: 10,
    STONE: 11,
};

// ── Crop Data ────────────────────────────────────────────────
const CROPS = {
    tomato:  { name: 'Tomato',  color: '#e74c3c', growDays: 3, value: 25 },
    corn:    { name: 'Corn',    color: '#f1c40f', growDays: 4, value: 35 },
    carrot:  { name: 'Carrot',  color: '#e67e22', growDays: 2, value: 15 },
    cabbage: { name: 'Cabbage', color: '#27ae60', growDays: 5, value: 50 },
};
const CROP_LIST = Object.keys(CROPS);

// ── Fish Data ────────────────────────────────────────────────
const FISH = [
    { name: 'Minnow',      rarity: 'Common',    color: '#7dcea0', drainRate: 0.3, clickGain: 8,  value: 10, weight: 40 },
    { name: 'Bass',         rarity: 'Common',    color: '#5dade2', drainRate: 0.5, clickGain: 6,  value: 20, weight: 30 },
    { name: 'Goldfish',     rarity: 'Rare',      color: '#f0932b', drainRate: 0.8, clickGain: 5,  value: 50, weight: 15 },
    { name: 'Shadow Bass',  rarity: 'Epic',      color: '#8e44ad', drainRate: 1.2, clickGain: 4,  value: 100, weight: 10 },
    { name: 'Golden Koi',   rarity: 'Legendary', color: '#f9ca24', drainRate: 1.8, clickGain: 3,  value: 250, weight: 5 },
];

// ── Tools ────────────────────────────────────────────────────
const TOOLS = ['Hoe', 'Water', 'Seeds', 'Rod'];

// ── Palette ──────────────────────────────────────────────────
const PAL = {
    grass1: '#4a8c3f', grass2: '#3d7a34',
    dirt: '#8B6914', dirtDark: '#6b4f10',
    tilled: '#5a3a1a', tilledWet: '#3d2810',
    water1: '#2980b9', water2: '#3498db', water3: '#1a6fa3',
    fence: '#8B6914', fenceDark: '#5a4510',
    path: '#c8a860', pathDark: '#a08040',
    stone: '#888', stoneDark: '#666',
    house1: '#8b4513', house2: '#a0522d', roof: '#b22222',
    skin: '#f4c89a', hat: '#daa520', overalls: '#4169e1',
    boots: '#5a3410',
};

// ── Game State ───────────────────────────────────────────────
let canvas, ctx;
let gameStarted = false;
let gameTime = 0; // ms elapsed per frame
let day = 1;
let hour = 6; // 6 AM start
let minute = 0;
let gold = 100;
let energy = 100;
let maxEnergy = 100;
let selectedTool = 0;
let cropType = 0; // index into CROP_LIST

// Player state
let player = { x: 12, y: 10, dir: 0, frame: 0, animTimer: 0, moving: false };
// dir: 0=down, 1=left, 2=right, 3=up

// Map
let map = [];
let cropData = {}; // "x,y" -> { type, stage, daysGrown, watered }

// Fishing state
let fishing = {
    active: false,
    casting: false,
    castTimer: 0,
    waiting: false,
    waitTimer: 0,
    biteReady: false,
    battling: false,
    progress: 0,
    fish: null,
    bobberY: 0,
    bobberAnim: 0,
    escapeTimer: 0,
    catchMessage: '',
    messageTimer: 0,
};

// Input
let keys = {};
let mouseX = 0, mouseY = 0;
let leftClick = false;
let rightClick = false;

// Particles
let particles = [];

// Notification
let notification = { text: '', timer: 0 };

// ── Map Generation ───────────────────────────────────────────
function generateMap() {
    map = [];
    for (let y = 0; y < ROWS; y++) {
        map[y] = [];
        for (let x = 0; x < COLS; x++) {
            map[y][x] = T.GRASS;
        }
    }

    // Pond (top-right area)
    for (let y = 1; y < 7; y++) {
        for (let x = 17; x < 24; x++) {
            const dx = x - 20, dy = y - 4;
            if (dx * dx + dy * dy * 1.5 < 12) {
                map[y][x] = T.WATER;
            }
        }
    }

    // Paths
    for (let x = 3; x < 22; x++) map[10][x] = T.PATH;
    for (let y = 3; y < 16; y++) map[y][10] = T.PATH;
    map[10][10] = T.PATH;

    // Farm area fencing (left side)
    for (let x = 2; x < 9; x++) { map[3][x] = T.FENCE; map[8][x] = T.FENCE; }
    for (let y = 3; y < 9; y++) { map[y][2] = T.FENCE; map[y][9] = T.FENCE; }
    map[8][5] = T.PATH; // gate

    // House (top-left)
    for (let y = 1; y < 3; y++) {
        for (let x = 3; x < 7; x++) {
            map[y][x] = T.HOUSE;
        }
    }

    // Stone decorations
    map[12][3] = T.STONE; map[12][4] = T.STONE;
    map[15][20] = T.STONE; map[15][21] = T.STONE;
    map[16][8] = T.STONE;

    // Lower garden area
    for (let x = 13; x < 18; x++) { map[12][x] = T.FENCE; map[16][x] = T.FENCE; }
    for (let y = 12; y < 17; y++) { map[y][12] = T.FENCE; map[y][18] = T.FENCE; }
    map[16][15] = T.PATH; // gate
}

// ── Drawing Helpers ──────────────────────────────────────────
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawPixelTile(tx, ty, type) {
    const x = tx * TILE, y = ty * TILE;

    switch (type) {
        case T.GRASS:
            drawRect(x, y, TILE, TILE, PAL.grass1);
            // Grass detail
            ctx.fillStyle = PAL.grass2;
            for (let i = 0; i < 4; i++) {
                const gx = x + ((tx * 7 + i * 11) % 28) + 2;
                const gy = y + ((ty * 13 + i * 7) % 26) + 3;
                ctx.fillRect(gx, gy, 2, 3);
            }
            break;

        case T.DIRT:
            drawRect(x, y, TILE, TILE, PAL.dirt);
            ctx.fillStyle = PAL.dirtDark;
            ctx.fillRect(x + 2, y + 2, 3, 2);
            ctx.fillRect(x + 20, y + 14, 4, 2);
            break;

        case T.TILLED:
            drawRect(x, y, TILE, TILE, PAL.tilled);
            ctx.fillStyle = '#4a2a10';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(x + 2, y + 4 + i * 7, TILE - 4, 2);
            }
            break;

        case T.WATERED:
            drawRect(x, y, TILE, TILE, PAL.tilledWet);
            ctx.fillStyle = '#2d1808';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(x + 2, y + 4 + i * 7, TILE - 4, 2);
            }
            // Water shimmer
            ctx.fillStyle = 'rgba(100,150,255,0.15)';
            ctx.fillRect(x + 4, y + 4, 8, 4);
            break;

        case T.PLANTED:
        case T.GROWING:
        case T.MATURE:
            // Soil background
            drawRect(x, y, TILE, TILE, PAL.tilledWet);
            ctx.fillStyle = '#2d1808';
            for (let i = 0; i < 4; i++) ctx.fillRect(x + 2, y + 4 + i * 7, TILE - 4, 2);
            // Draw crop
            drawCropOnTile(tx, ty, type);
            break;

        case T.WATER:
            const waveOffset = Math.sin((gameTime / 800) + tx * 0.5 + ty * 0.3) * 0.5;
            ctx.fillStyle = waveOffset > 0 ? PAL.water1 : PAL.water2;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = PAL.water3;
            const wy = y + 8 + Math.sin((gameTime / 600) + tx) * 3;
            ctx.fillRect(x + 4, wy, 10, 2);
            ctx.fillRect(x + 18, wy + 8, 8, 2);
            break;

        case T.FENCE:
            drawRect(x, y, TILE, TILE, PAL.grass1);
            // Fence post
            ctx.fillStyle = PAL.fence;
            ctx.fillRect(x + 12, y + 4, 8, 24);
            ctx.fillStyle = PAL.fenceDark;
            ctx.fillRect(x + 12, y + 4, 8, 2);
            // Horizontal bars
            ctx.fillStyle = PAL.fence;
            ctx.fillRect(x, y + 8, TILE, 4);
            ctx.fillRect(x, y + 20, TILE, 4);
            ctx.fillStyle = PAL.fenceDark;
            ctx.fillRect(x, y + 8, TILE, 1);
            ctx.fillRect(x, y + 20, TILE, 1);
            break;

        case T.PATH:
            drawRect(x, y, TILE, TILE, PAL.path);
            ctx.fillStyle = PAL.pathDark;
            ctx.fillRect(x + 1, y + 1, 2, 2);
            ctx.fillRect(x + 22, y + 18, 3, 2);
            ctx.fillRect(x + 10, y + 26, 2, 2);
            break;

        case T.HOUSE:
            // Wall
            drawRect(x, y, TILE, TILE, PAL.house1);
            ctx.fillStyle = PAL.house2;
            ctx.fillRect(x, y, TILE, 2);
            // Roof
            ctx.fillStyle = PAL.roof;
            ctx.fillRect(x, y, TILE, 10);
            ctx.fillStyle = '#d43b3b';
            ctx.fillRect(x, y, TILE, 3);
            // Window
            if (tx === 4 || tx === 5) {
                ctx.fillStyle = '#fff8a0';
                ctx.fillRect(x + 10, y + 16, 12, 10);
                ctx.fillStyle = PAL.house1;
                ctx.fillRect(x + 15, y + 16, 2, 10);
                ctx.fillRect(x + 10, y + 20, 12, 2);
            }
            break;

        case T.STONE:
            drawRect(x, y, TILE, TILE, PAL.grass1);
            ctx.fillStyle = PAL.stone;
            ctx.fillRect(x + 4, y + 8, 24, 18);
            ctx.fillStyle = PAL.stoneDark;
            ctx.fillRect(x + 4, y + 8, 24, 3);
            ctx.fillStyle = '#999';
            ctx.fillRect(x + 8, y + 14, 6, 4);
            break;
    }
}

function drawCropOnTile(tx, ty, type) {
    const key = tx + ',' + ty;
    const cd = cropData[key];
    if (!cd) return;

    const crop = CROPS[cd.type];
    const x = tx * TILE, y = ty * TILE;
    const cx = x + 16, cy = y + 16;

    if (type === T.PLANTED) {
        // Seed / tiny sprout
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(cx - 2, cy + 4, 4, 6);
        ctx.fillRect(cx - 4, cy + 2, 3, 4);
        ctx.fillRect(cx + 1, cy, 3, 4);
    } else if (type === T.GROWING) {
        // Medium plant
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(cx - 2, cy - 2, 4, 14);
        ctx.fillRect(cx - 8, cy - 4, 8, 4);
        ctx.fillRect(cx + 2, cy - 6, 6, 4);
        ctx.fillRect(cx - 6, cy + 2, 4, 3);
    } else if (type === T.MATURE) {
        // Full plant with fruit
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(cx - 2, cy - 4, 4, 16);
        ctx.fillRect(cx - 10, cy - 6, 20, 4);
        ctx.fillRect(cx - 8, cy - 2, 16, 3);
        // Fruit/vegetable
        ctx.fillStyle = crop.color;
        ctx.fillRect(cx - 6, cy - 10, 6, 6);
        ctx.fillRect(cx + 2, cy - 8, 5, 5);
        ctx.fillRect(cx - 3, cy - 12, 4, 4);
        // Leaf tops
        ctx.fillStyle = '#1a8c30';
        ctx.fillRect(cx - 5, cy - 12, 3, 2);
        ctx.fillRect(cx + 3, cy - 10, 3, 2);
    }
}

// ── Player Drawing ───────────────────────────────────────────
function drawPlayer() {
    const px = player.x * TILE, py = player.y * TILE;
    const frame = player.moving ? Math.floor(player.frame) % 4 : 0;
    const legOffset = player.moving ? Math.sin(player.frame * 2) * 3 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 30, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boots
    ctx.fillStyle = PAL.boots;
    ctx.fillRect(px + 8 + legOffset, py + 24, 6, 6);
    ctx.fillRect(px + 18 - legOffset, py + 24, 6, 6);

    // Body (overalls)
    ctx.fillStyle = PAL.overalls;
    ctx.fillRect(px + 8, py + 12, 16, 14);
    // Strap details
    ctx.fillStyle = '#3558b8';
    ctx.fillRect(px + 10, py + 12, 3, 6);
    ctx.fillRect(px + 19, py + 12, 3, 6);

    // Arms
    ctx.fillStyle = PAL.skin;
    if (player.dir === 1) { // left
        ctx.fillRect(px + 4, py + 14, 4, 8);
    } else if (player.dir === 2) { // right
        ctx.fillRect(px + 24, py + 14, 4, 8);
    } else {
        ctx.fillRect(px + 4, py + 14, 4, 8);
        ctx.fillRect(px + 24, py + 14, 4, 8);
    }

    // Head
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(px + 9, py + 4, 14, 10);

    // Eyes
    ctx.fillStyle = '#333';
    if (player.dir === 0) { // down
        ctx.fillRect(px + 12, py + 8, 3, 3);
        ctx.fillRect(px + 18, py + 8, 3, 3);
    } else if (player.dir === 3) { // up - no eyes visible
    } else if (player.dir === 1) { // left
        ctx.fillRect(px + 10, py + 8, 3, 3);
    } else { // right
        ctx.fillRect(px + 20, py + 8, 3, 3);
    }

    // Hat
    ctx.fillStyle = PAL.hat;
    ctx.fillRect(px + 6, py + 0, 20, 6);
    ctx.fillRect(px + 9, py - 2, 14, 4);
    ctx.fillStyle = '#c49520';
    ctx.fillRect(px + 6, py + 4, 20, 2);

    // Tool indicator above head
    drawToolIndicator(px, py);
}

function drawToolIndicator(px, py) {
    const tool = TOOLS[selectedTool];
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px + 4, py - 14, 24, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tool, px + 16, py - 6);
}

// ── HUD Drawing ──────────────────────────────────────────────
function drawHUD() {
    const hy = HEIGHT;

    // Background
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(0, hy, CANVAS_W, HUD_HEIGHT);
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(0, hy, CANVAS_W, 3);

    // Tool slots
    for (let i = 0; i < 4; i++) {
        const sx = 10 + i * 50;
        const selected = i === selectedTool;
        ctx.fillStyle = selected ? '#6a4a2a' : '#3a2a1a';
        ctx.fillRect(sx, hy + 8, 44, 44);
        ctx.strokeStyle = selected ? '#ffd700' : '#5a3a1a';
        ctx.lineWidth = selected ? 3 : 1;
        ctx.strokeRect(sx, hy + 8, 44, 44);

        // Tool icon (simple pixel art)
        drawToolIcon(sx + 6, hy + 12, i);

        // Key number
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(i + 1, sx + 2, hy + 18);
    }

    // Day / Time
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    const timeStr = `Day ${day}  ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    ctx.fillText(timeStr, 220, hy + 24);

    // Sun/Moon icon
    if (hour >= 6 && hour < 19) {
        ctx.fillStyle = '#ffdd44';
        ctx.beginPath();
        ctx.arc(220 + ctx.measureText(timeStr).width + 16, hy + 20, 8, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#aabbdd';
        ctx.beginPath();
        ctx.arc(220 + ctx.measureText(timeStr).width + 16, hy + 20, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.arc(220 + ctx.measureText(timeStr).width + 20, hy + 18, 7, 0, Math.PI * 2);
        ctx.fill();
    }

    // Energy bar
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText('EP', 220, hy + 48);
    ctx.fillStyle = '#333';
    ctx.fillRect(245, hy + 38, 102, 14);
    ctx.fillStyle = energy > 30 ? '#3498db' : '#e74c3c';
    ctx.fillRect(246, hy + 39, energy, 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`${Math.floor(energy)}%`, 280, hy + 49);

    // Gold
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 ${gold}G`, 370, hy + 24);

    // Selected seed type (when Seeds tool is active)
    if (selectedTool === 2) {
        const cropName = CROPS[CROP_LIST[cropType]].name;
        ctx.fillStyle = '#7dcea0';
        ctx.font = '12px monospace';
        ctx.fillText(`Seed: ${cropName} (Q/R cycle)`, 370, hy + 48);
    }

    // Inventory hints
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('E=Sleep  Q/R=Cycle Seeds', CANVAS_W - 10, hy + 58);

    // Notification
    if (notification.timer > 0) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(0.7, notification.timer / 500)})`;
        const tw = ctx.measureText(notification.text).width + 20;
        ctx.fillRect(CANVAS_W / 2 - tw / 2, 10, tw, 28);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(notification.text, CANVAS_W / 2, 30);
    }
}

function drawToolIcon(x, y, tool) {
    switch (tool) {
        case 0: // Hoe
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(x + 4, y + 6, 4, 22);
            ctx.fillStyle = '#888';
            ctx.fillRect(x, y + 2, 14, 6);
            ctx.fillStyle = '#666';
            ctx.fillRect(x, y + 2, 14, 2);
            break;
        case 1: // Water
            ctx.fillStyle = '#3498db';
            ctx.fillRect(x + 4, y + 8, 16, 16);
            ctx.fillRect(x + 2, y + 8, 20, 4);
            ctx.fillStyle = '#2980b9';
            ctx.fillRect(x + 18, y + 6, 8, 4);
            ctx.fillRect(x + 6, y + 4, 4, 6);
            break;
        case 2: // Seeds
            ctx.fillStyle = '#c8a060';
            ctx.fillRect(x + 4, y + 4, 20, 24);
            ctx.fillStyle = '#a08040';
            ctx.fillRect(x + 4, y + 4, 20, 3);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(x + 10, y + 14, 4, 8);
            ctx.fillRect(x + 8, y + 12, 3, 4);
            ctx.fillRect(x + 15, y + 10, 3, 4);
            break;
        case 3: // Rod
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(x + 14, y + 2, 4, 26);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(x + 16, y + 2, 1, 20);
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(x + 16, y + 24, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

// ── Day/Night Overlay ────────────────────────────────────────
function drawDayNightOverlay() {
    let alpha = 0;
    if (hour >= 19) alpha = Math.min(0.5, (hour - 19 + minute / 60) * 0.15);
    else if (hour >= 21) alpha = 0.5;
    else if (hour < 6) alpha = 0.5;
    else if (hour < 8) alpha = Math.max(0, 0.3 - (hour - 6 + minute / 60) * 0.15);

    if (alpha > 0) {
        ctx.fillStyle = `rgba(10, 10, 40, ${alpha})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
}

// ── Fishing System ───────────────────────────────────────────
function selectRandomFish() {
    const totalWeight = FISH.reduce((s, f) => s + f.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const f of FISH) {
        rand -= f.weight;
        if (rand <= 0) return { ...f };
    }
    return { ...FISH[0] };
}

function startFishing() {
    if (energy < 5) {
        notify("Too tired to fish!");
        return;
    }
    energy -= 5;
    fishing.active = true;
    fishing.casting = true;
    fishing.castTimer = 30;
    fishing.waiting = false;
    fishing.biteReady = false;
    fishing.battling = false;
    fishing.progress = 0;
    fishing.catchMessage = '';
    fishing.messageTimer = 0;
    notify("Casting line...");
    if (typeof sounds !== 'undefined') sounds.castRod();
}

function updateFishing(dt) {
    if (!fishing.active) return;

    if (fishing.casting) {
        fishing.castTimer -= dt / 16;
        if (fishing.castTimer <= 0) {
            fishing.casting = false;
            fishing.waiting = true;
            fishing.waitTimer = 120 + Math.random() * 240; // 2-6 seconds at 60fps
            fishing.bobberAnim = 0;
        }
        return;
    }

    if (fishing.waiting) {
        fishing.waitTimer -= dt / 16;
        fishing.bobberAnim += dt / 16;
        if (fishing.waitTimer <= 0) {
            fishing.biteReady = true;
            fishing.waiting = false;
            fishing.fish = selectRandomFish();
            fishing.escapeTimer = 300; // 5 seconds to react
            notify(`🐟 A ${fishing.fish.name} is biting! RIGHT-CLICK to fight!`);
            if (typeof sounds !== 'undefined') { sounds.biteAlert(); sounds.splash(); }
        }
        return;
    }

    if (fishing.biteReady && !fishing.battling) {
        fishing.escapeTimer -= dt / 16;
        fishing.bobberAnim += dt / 16 * 4; // vigorous bobbing
        if (fishing.escapeTimer <= 0) {
            notify("The fish got away...");
            fishing.active = false;
            return;
        }
        // Start battle on right-click
        if (rightClick) {
            fishing.battling = true;
            fishing.biteReady = false;
            fishing.progress = 30; // start at 30%
            rightClick = false;
        }
        return;
    }

    if (fishing.battling) {
        // Fish fights back — progress drains
        fishing.progress -= fishing.fish.drainRate * (dt / 16);

        // Right click gains progress
        if (rightClick) {
            fishing.progress += fishing.fish.clickGain;
            rightClick = false;
            // Click particle
            spawnParticle(player.x * TILE + 16, player.y * TILE - 20, '#ffd700', '+');
        }

        // Clamp
        fishing.progress = Math.max(0, Math.min(100, fishing.progress));

        // Win / Lose
        if (fishing.progress >= 100) {
            gold += fishing.fish.value;
            notify(`🎣 Caught a ${fishing.fish.rarity} ${fishing.fish.name}! (+${fishing.fish.value}G)`);
            spawnParticle(player.x * TILE + 16, player.y * TILE - 30, fishing.fish.color, '🐟');
            fishing.active = false;
        } else if (fishing.progress <= 0) {
            notify(`💨 The ${fishing.fish.name} escaped!`);
            fishing.active = false;
        }
    }
}

function drawFishingUI() {
    if (!fishing.active) return;

    const px = player.x * TILE, py = player.y * TILE;

    // Find nearest water tile for bobber
    let bx = px + 32, by = py - 16;
    if (player.dir === 3) { bx = px + 16; by = py - 40; }
    else if (player.dir === 0) { bx = px + 16; by = py + 50; }
    else if (player.dir === 1) { bx = px - 24; by = py + 10; }
    else { bx = px + 56; by = py + 10; }

    // Line
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 16, py + 8);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Bobber
    const bobY = fishing.biteReady || fishing.battling
        ? Math.sin(fishing.bobberAnim * 0.5) * 4
        : Math.sin(fishing.bobberAnim * 0.1) * 2;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(bx, by + bobY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bx, by + bobY - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    if (fishing.waiting) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(px - 20, py - 30, 72, 18);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const dots = '.'.repeat(Math.floor(fishing.bobberAnim / 20) % 4);
        ctx.fillText('Waiting' + dots, px + 16, py - 17);
    }

    if (fishing.biteReady && !fishing.battling) {
        // "BITE!" indicator
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🐟 BITE!', px + 16, py - 30);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('Right-Click!', px + 16, py - 16);
    }

    if (fishing.battling) {
        // Progress bar
        const barW = 120, barH = 16;
        const barX = px + 16 - barW / 2, barY = py - 50;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX - 4, barY - 20, barW + 8, barH + 30);

        // Fish name and rarity
        ctx.fillStyle = fishing.fish.color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${fishing.fish.rarity} ${fishing.fish.name}`, px + 16, barY - 6);

        // Bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);

        // Bar fill
        const ratio = fishing.progress / 100;
        const barColor = ratio > 0.6 ? '#2ecc71' : ratio > 0.3 ? '#f39c12' : '#e74c3c';
        ctx.fillStyle = barColor;
        ctx.fillRect(barX + 1, barY + 1, (barW - 2) * ratio, barH - 2);

        // Percentage text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${Math.floor(fishing.progress)}%`, px + 16, barY + 12);

        // "Right-Click!" prompt
        ctx.fillStyle = '#ffd700';
        ctx.font = '9px monospace';
        ctx.fillText('RIGHT-CLICK to reel!', px + 16, barY + barH + 8);
    }
}

// ── Particles ────────────────────────────────────────────────
function spawnParticle(x, y, color, text) {
    particles.push({ x, y, vy: -1.5, life: 60, color, text, alpha: 1 });
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.vy * (dt / 16);
        p.life -= dt / 16;
        p.alpha = Math.max(0, p.life / 60);
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
}

// ── Notification ─────────────────────────────────────────────
function notify(text) {
    notification.text = text;
    notification.timer = 2500;
}

// ── Tool Actions ─────────────────────────────────────────────
function useTool() {
    // Get tile in front of player
    const dirs = [[0, 1], [-1, 0], [1, 0], [0, -1]]; // down, left, right, up
    const dx = dirs[player.dir][0];
    const dy = dirs[player.dir][1];
    const tx = player.x + dx;
    const ty = player.y + dy;

    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return;

    const tile = map[ty][tx];
    const key = tx + ',' + ty;

    if (energy < 2) {
        notify("Too tired! Press E to sleep.");
        return;
    }

    switch (selectedTool) {
        case 0: // Hoe
            if (tile === T.GRASS || tile === T.DIRT) {
                map[ty][tx] = T.TILLED;
                energy -= 3;
                spawnParticle(tx * TILE + 16, ty * TILE, '#8B6914', '⛏');
                notify("Tilled the soil!");
                if (typeof sounds !== 'undefined') sounds.till();
            }
            break;

        case 1: // Water
            if (tile === T.TILLED) {
                map[ty][tx] = T.WATERED;
                energy -= 2;
                spawnParticle(tx * TILE + 16, ty * TILE, '#3498db', '💧');
                if (typeof sounds !== 'undefined') sounds.water();
            } else if (tile === T.PLANTED || tile === T.GROWING) {
                if (cropData[key]) cropData[key].watered = true;
                energy -= 2;
                spawnParticle(tx * TILE + 16, ty * TILE, '#3498db', '💧');
                if (typeof sounds !== 'undefined') sounds.water();
            }
            break;

        case 2: // Seeds
            if (tile === T.TILLED || tile === T.WATERED) {
                map[ty][tx] = T.PLANTED;
                cropData[key] = {
                    type: CROP_LIST[cropType],
                    stage: 0,
                    daysGrown: 0,
                    watered: tile === T.WATERED,
                };
                energy -= 1;
                spawnParticle(tx * TILE + 16, ty * TILE, '#27ae60', '🌱');
                notify(`Planted ${CROPS[CROP_LIST[cropType]].name} seeds!`);
                if (typeof sounds !== 'undefined') sounds.plant();
            } else if (tile === T.MATURE) {
                // Harvest
                harvestCrop(tx, ty);
            }
            break;

        case 3: // Rod
            if (isAdjacentToWater(player.x, player.y) && !fishing.active) {
                startFishing();
            } else if (tile === T.MATURE) {
                harvestCrop(tx, ty);
            }
            break;
    }

    // Universal harvest: clicking on mature crop with any tool
    if (tile === T.MATURE && selectedTool !== 2) {
        harvestCrop(tx, ty);
    }
}

function harvestCrop(tx, ty) {
    const key = tx + ',' + ty;
    const cd = cropData[key];
    if (!cd) return;
    const crop = CROPS[cd.type];
    gold += crop.value;
    spawnParticle(tx * TILE + 16, ty * TILE, crop.color, `+${crop.value}G`);
    notify(`Harvested ${crop.name}! (+${crop.value}G)`);
    delete cropData[key];
    map[ty][tx] = T.TILLED;
    if (typeof sounds !== 'undefined') { sounds.harvest(); sounds.coin(); }
}

function isAdjacentToWater(px, py) {
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
        const nx = px + dx, ny = py + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && map[ny][nx] === T.WATER) {
            return true;
        }
    }
    return false;
}

// ── Day Cycle / Sleep ────────────────────────────────────────
function advanceDay() {
    day++;
    hour = 6;
    minute = 0;
    energy = maxEnergy;

    // Grow crops
    for (const key in cropData) {
        const cd = cropData[key];
        const [tx, ty] = key.split(',').map(Number);
        const crop = CROPS[cd.type];

        if (cd.watered) {
            cd.daysGrown++;
            cd.watered = false;
        }

        if (cd.daysGrown >= crop.growDays) {
            map[ty][tx] = T.MATURE;
        } else if (cd.daysGrown >= Math.floor(crop.growDays / 2)) {
            map[ty][tx] = T.GROWING;
        }
    }

    // Reset watered tiles to tilled
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === T.WATERED && !cropData[x + ',' + y]) {
                map[y][x] = T.TILLED;
            }
        }
    }

    notify(`☀️ Day ${day} — Good morning! Energy restored.`);
}

function advanceTime(dt) {
    minute += dt / 1000 * 2; // 2 in-game minutes per real second
    if (minute >= 60) {
        minute -= 60;
        hour++;
        if (hour >= 24) {
            hour = 0;
        }
    }
}

// ── Movement / Input ─────────────────────────────────────────
function canMoveTo(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    const t = map[y][x];
    return t !== T.WATER && t !== T.FENCE && t !== T.HOUSE && t !== T.STONE;
}

let moveTimer = 0;
const MOVE_DELAY = 120; // ms between moves

function handleMovement(dt) {
    if (fishing.active) return;

    moveTimer -= dt;
    if (moveTimer > 0) return;

    let moved = false;
    let nx = player.x, ny = player.y;

    if (keys['KeyW'] || keys['ArrowUp']) { ny--; player.dir = 3; moved = true; }
    else if (keys['KeyS'] || keys['ArrowDown']) { ny++; player.dir = 0; moved = true; }
    else if (keys['KeyA'] || keys['ArrowLeft']) { nx--; player.dir = 1; moved = true; }
    else if (keys['KeyD'] || keys['ArrowRight']) { nx++; player.dir = 2; moved = true; }

    if (moved && canMoveTo(nx, ny)) {
        player.x = nx;
        player.y = ny;
        player.moving = true;
        player.animTimer = 200;
        moveTimer = MOVE_DELAY;
    } else {
        player.moving = moveTimer > -100;
    }

    if (moved) {
        player.frame += dt / 100;
    }
}

// ── Input Handlers ───────────────────────────────────────────
function setupInput() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;

        if (e.code === 'Digit1') selectedTool = 0;
        if (e.code === 'Digit2') selectedTool = 1;
        if (e.code === 'Digit3') selectedTool = 2;
        if (e.code === 'Digit4') selectedTool = 3;

        if (e.code === 'KeyQ') {
            cropType = (cropType - 1 + CROP_LIST.length) % CROP_LIST.length;
            if (selectedTool === 2) notify(`Seeds: ${CROPS[CROP_LIST[cropType]].name}`);
        }
        if (e.code === 'KeyR') {
            cropType = (cropType + 1) % CROP_LIST.length;
            if (selectedTool === 2) notify(`Seeds: ${CROPS[CROP_LIST[cropType]].name}`);
        }

        if (e.code === 'KeyE') {
            advanceDay();
        }

        e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // left click
            leftClick = true;
            useTool();
        }
        if (e.button === 2) { // right click
            rightClick = true;
        }
        e.preventDefault();
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) leftClick = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        mouseY = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    });
}

// ── Render ───────────────────────────────────────────────────
function render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw map
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            drawPixelTile(x, y, map[y][x]);
        }
    }

    // Draw player
    drawPlayer();

    // Fishing UI
    drawFishingUI();

    // Day/Night overlay
    drawDayNightOverlay();

    // Particles
    drawParticles();

    // Cursor highlight (tile player is facing)
    if (!fishing.active) {
        const dirs = [[0, 1], [-1, 0], [1, 0], [0, -1]];
        const cx = player.x + dirs[player.dir][0];
        const cy = player.y + dirs[player.dir][1];
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx * TILE + 1, cy * TILE + 1, TILE - 2, TILE - 2);
        }
    }

    // HUD
    drawHUD();
}

// ── Game Loop ────────────────────────────────────────────────
let lastTime = 0;

function gameLoop(timestamp) {
    if (!gameStarted) return;

    const dt = timestamp - lastTime;
    lastTime = timestamp;

    // Cap dt to prevent huge jumps
    const cappedDt = Math.min(dt, 50);

    // Update time
    advanceTime(cappedDt);

    // Movement
    handleMovement(cappedDt);

    // Fishing
    updateFishing(cappedDt);

    // Particles
    updateParticles(cappedDt);

    // Notification timer
    if (notification.timer > 0) notification.timer -= cappedDt;

    // Game time for animations
    gameTime += cappedDt;

    // Render
    render();

    requestAnimationFrame(gameLoop);
}

// ── Init ─────────────────────────────────────────────────────
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // Scale canvas for display
    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - 40;
    const scale = Math.min(maxW / CANVAS_W, maxH / CANVAS_H, 2);
    canvas.style.width = (CANVAS_W * scale) + 'px';
    canvas.style.height = (CANVAS_H * scale) + 'px';

    generateMap();
    setupInput();

    // Draw initial state
    render();
}

function startGame() {
    document.getElementById('instructions').style.display = 'none';
    gameStarted = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    notify('Welcome to Pixel Farm! Use WASD to move, 1-4 for tools.');
}

// ── Window Load ──────────────────────────────────────────────
window.addEventListener('load', init);
window.addEventListener('resize', () => {
    if (!canvas) return;
    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - 40;
    const scale = Math.min(maxW / CANVAS_W, maxH / CANVAS_H, 2);
    canvas.style.width = (CANVAS_W * scale) + 'px';
    canvas.style.height = (CANVAS_H * scale) + 'px';
});
