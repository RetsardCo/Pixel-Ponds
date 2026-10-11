# 🎣 Pixel Ponds - 2D Stardew Valley & Fishing Game

A 2D retro farm simulator and fishing mini-game inspired by *Stardew Valley*, built in HTML5 Canvas and JavaScript with generated 16-bit pixel art assets and Web Audio API synthesized sound effects.

---

## 🎮 Game Features

- **Farming Mechanics**:
  - **Hoe (Slot 1)**: Till bare soil into tillable farm plots.
  - **Watering Can (Slot 2)**: Water soil to hydrate seeds and enable growth.
  - **Seeds (Slots 3 & 4)**: Plant Parsnips (2 days) and Strawberries (3 days).
  - **Hand / Scythe (Slot 6)**: Harvest mature crops.
  - **Growth Stages**: Visual progression from seeds to sprouts, leaves, flowers, and ripe crops.

- **Fishing Mini-Game (Battle System)**:
  - **Fishing Rod (Slot 5)**: Walk up to the pond dock and Left-Click into the water to cast your line.
  - **Waiting & Bite**: Watch bobber physics and water ripples. When a fish bites, an exclamation mark `!` alerts you.
  - **Hook**: Click within the bite window to hook the fish.
  - **Battle Mode**:
    - Right-click battle prompt appears with tension progress gauge.
    - **Right-Click** repeatedly to reel the fish in against active pull-back tension decay!
    - Higher rarity fish (*Common*, *Uncommon*, *Rare*, *Epic*, *Legendary*) require more right-clicks and fight back more aggressively.
    - Fill gauge to 100% to catch the fish! If tension drops to 0%, the fish snaps the line and escapes.
    - Catch fanfare celebration card displays fish artwork, rarity stars, and gold value.

- **Day / Night Cycle & Atmosphere**:
  - In-game clock (6:00 AM to 2:00 AM) with dynamic ambient tinting (morning warmth, bright daylight, sunset glow, and moonlit night with glowing windows, lanterns, and drifting fireflies).
  - Sleep button or Farmhouse bed to advance the day, replenish energy, and grow crops.

- **Economy & Town Store**:
  - **Shipping Bin**: Deposit harvested crops and fish catches for Gold.
  - **Seed Shop**: Purchase additional Parsnip seeds, Strawberry seeds, or Energy Tonics.
  - **Backpack Inventory**: View stored crops, seeds, and fish trophies.

---

## 🎨 Pixel Art Assets Created

Generated using generative image tools:
- `assets/farmer.jpg`: 16-bit farmer character sprite in blue overalls and straw hat.
- `assets/tileset.jpg`: Farm environment tiles (grass, tilled soil, pond shoreline, fences, stone path, farm chest).
- `assets/fish.jpg`: Fish species sprite sheet (Bluegill, Trout, Salmon, Catfish, Swordfish, Golden Koi).
- `assets/items.jpg`: Farm items and tools icons (Hoe, Can, Rod, Seeds, Parsnip, Carrot, Turnip, Strawberry).
- `assets/cover.jpg`: Valley Farm sunrise landscape cover banner.

---

## ⌨️ Controls

| Action | Control |
|---|---|
| **Move** | `W, A, S, D` or `Arrow Keys` |
| **Select Hotbar Slot** | Keys `1` through `6` or Click Slots |
| **Farm / Cast Action** | `Left-Click` on World / Facing Tile |
| **Hook Biting Fish** | `Left-Click` or `Space` during `!` alert |
| **Reel In / Fight Fish** | **`Right-Click`** repeatedly during Battle |
| **Open Backpack** | `I` key or `🎒 Inventory` button |
| **Sleep / Advance Day**| `🛏️ Sleep / Save` button |
