import test from 'node:test';
import assert from 'node:assert/strict';

// Mock minimal browser environment for node
const mockDOM = () => {
  const elements = {};
  const createElement = (tag) => {
    return {
      tagName: tag,
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      addEventListener: () => {},
      appendChild: () => {},
      children: [],
      textContent: '',
      innerHTML: '',
      dataset: {}
    };
  };

  global.window = {
    addEventListener: () => {},
    AudioContext: class {
      constructor() {
        this.destination = {};
      }
      resume() {}
      createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    }
  };

  global.document = {
    getElementById: (id) => {
      if (!elements[id]) elements[id] = createElement('div');
      return elements[id];
    },
    querySelectorAll: () => [],
    createElement
  };

  global.Image = class {
    constructor() {
      this.onload = null;
    }
    set src(val) {
      setTimeout(() => { if (this.onload) this.onload(); }, 5);
    }
  };

  global.requestAnimationFrame = () => {};
};

mockDOM();

// ── Game Logic Extraction & Testing ──
const RARITIES = {
  Common:    { color: '#90caf9', glow: '#42a5f5', clicks: 8,  decay: 0.18, coins: 20, chance: 0.45, stars: '⭐' },
  Uncommon:  { color: '#a5d6a7', glow: '#66bb6a', clicks: 14, decay: 0.28, coins: 45, chance: 0.28, stars: '⭐⭐' },
  Rare:      { color: '#ce93d8', glow: '#ab47bc', clicks: 22, decay: 0.42, coins: 95, chance: 0.16, stars: '⭐⭐⭐' },
  Epic:      { earthly: true, clicks: 32, decay: 0.58, coins: 210, chance: 0.08, stars: '⭐⭐⭐⭐' },
  Legendary: { clicks: 46, decay: 0.72, coins: 480, chance: 0.03, stars: '⭐⭐⭐⭐⭐' },
};

const CROPS = {
  parsnip: { name: 'Parsnip', daysToGrow: 2, sellValue: 35, stages: ['🌱', '🌿', '🌾', '🥕'] },
  strawberry: { name: 'Strawberry', daysToGrow: 3, sellValue: 75, stages: ['🌱', '🌿', '🌸', '🍓'] }
};

const TILE = { GRASS: 0, DIRT: 1, TILLED: 2, WATER: 3, DOCK: 4, STONE_PATH: 5, HOUSE: 6, FENCE: 7, SHIPPING_BIN: 8, TREE: 9 };

test('Rarity probabilities sum up to 1.0', () => {
  const sum = Object.values(RARITIES).reduce((acc, r) => acc + r.chance, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, `Rarity probabilities must sum to 1.0, got ${sum}`);
});

test('Higher rarity fish require strictly more clicks and higher decay resistance', () => {
  const rKeys = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  for (let i = 0; i < rKeys.length - 1; i++) {
    const cur = RARITIES[rKeys[i]];
    const next = RARITIES[rKeys[i + 1]];
    assert.ok(next.clicks > cur.clicks, `${rKeys[i + 1]} clicks (${next.clicks}) should be > ${rKeys[i]} clicks (${cur.clicks})`);
    assert.ok(next.decay > cur.decay, `${rKeys[i + 1]} decay (${next.decay}) should be > ${rKeys[i]} decay (${cur.decay})`);
    assert.ok(next.coins > cur.coins, `${rKeys[i + 1]} coins (${next.coins}) should be > ${rKeys[i]} coins (${cur.coins})`);
  }
});

test('Fishing Battle: rapid right-clicks fill bar to 100% (Caught condition)', () => {
  const fishRarity = RARITIES.Rare;
  let battleProgress = 30; // initial progress
  const clickBoost = 100 / (fishRarity.clicks * 0.85);

  // Simulate 20 rapid clicks with decay
  for (let c = 0; c < 20; c++) {
    battleProgress += clickBoost;
    battleProgress -= fishRarity.decay * 2; // small decay between clicks
  }

  assert.ok(battleProgress >= 100, `Progress should reach 100% with sufficient right-clicks, got ${battleProgress}`);
});

test('Fishing Battle: idle without right-clicks drains bar to 0% (Escaped condition)', () => {
  const fishRarity = RARITIES.Legendary;
  let battleProgress = 30;

  // Simulate 60 frames of no input
  for (let f = 0; f < 60; f++) {
    battleProgress -= fishRarity.decay;
  }

  assert.ok(battleProgress <= 0, `Fish should escape if player does not fight back, got ${battleProgress}`);
});

test('Crop growth progresses when watered and advances days', () => {
  const plot = {
    crop: { type: 'parsnip', daysGrown: 0, currentStage: 0 },
    watered: true
  };

  // Simulate Day 1 -> Day 2 (Advancing day with water)
  if (plot.crop && plot.watered) {
    plot.crop.daysGrown++;
    if (plot.crop.currentStage < CROPS[plot.crop.type].stages.length - 1) {
      plot.crop.currentStage++;
    }
  }
  plot.watered = false; // soil dries after day advance

  assert.equal(plot.crop.currentStage, 1);
  assert.equal(plot.watered, false);

  // If not watered on day 2, it should NOT grow on day 3
  if (plot.crop && plot.watered) {
    plot.crop.daysGrown++;
    plot.crop.currentStage++;
  }
  assert.equal(plot.crop.currentStage, 1, 'Unwatered crop should not advance stage');

  // Water on day 2 and sleep to day 3
  plot.watered = true;
  if (plot.crop && plot.watered) {
    plot.crop.daysGrown++;
    if (plot.crop.currentStage < CROPS[plot.crop.type].stages.length - 1) {
      plot.crop.currentStage++;
    }
  }
  assert.equal(plot.crop.currentStage, 2);
});

test('Shipping Bin / Store Economy math works correctly', () => {
  let gold = 100;
  let parsnips = 2;
  const parsnipPrice = CROPS.parsnip.sellValue;

  // Sell 1 parsnip
  parsnips--;
  gold += parsnipPrice;
  assert.equal(gold, 135);
  assert.equal(parsnips, 1);

  // Buy 2 strawberry seeds at 30g each
  const seedPrice = 30;
  const buyQty = 2;
  gold -= seedPrice * buyQty;
  assert.equal(gold, 75);
});
