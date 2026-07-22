/**
 * SpatialIndex.js
 * High-performance 2D Spatial Hash Grid for fast object and anchor queries.
 * Optimizes nearby object search for 500+ objects on screen.
 */

class SpatialIndex {
  constructor(cellSize = 120) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.items = new Map();
  }

  /**
   * Helper to get cell key string
   */
  _getKey(cellX, cellY) {
    return `${cellX},${cellY}`;
  }

  /**
   * Calculate cell bounding range for an object or bounding box
   */
  _getBounds(item) {
    const w = item.w || 40;
    const h = item.h || 40;
    const minX = (item.x - w / 2);
    const maxX = (item.x + w / 2);
    const minY = (item.y - h / 2);
    const maxY = (item.y + h / 2);

    return {
      minCellX: Math.floor(minX / this.cellSize),
      maxCellX: Math.floor(maxX / this.cellSize),
      minCellY: Math.floor(minY / this.cellSize),
      maxCellY: Math.floor(maxY / this.cellSize),
      minX, maxX, minY, maxY
    };
  }

  /**
   * Insert an item into the spatial grid
   */
  insert(item) {
    if (!item || !item.id) return;
    this.remove(item.id);

    const bounds = this._getBounds(item);
    const keys = [];

    for (let cx = bounds.minCellX; cx <= bounds.maxCellX; cx++) {
      for (let cy = bounds.minCellY; cy <= bounds.maxCellY; cy++) {
        const key = this._getKey(cx, cy);
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key).add(item);
        keys.push(key);
      }
    }

    this.items.set(item.id, { item, keys });
  }

  /**
   * Remove an item from the spatial grid by ID
   */
  remove(id) {
    const entry = this.items.get(id);
    if (!entry) return;

    for (const key of entry.keys) {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(entry.item);
        if (cell.size === 0) {
          this.grid.delete(key);
        }
      }
    }
    this.items.delete(id);
  }

  /**
   * Update an item's position/size in the grid
   */
  update(item) {
    this.insert(item);
  }

  /**
   * Clear all items from the grid
   */
  clear() {
    this.grid.clear();
    this.items.clear();
  }

  /**
   * Rebuild grid with an array of items
   */
  rebuild(items = []) {
    this.clear();
    for (const item of items) {
      this.insert(item);
    }
  }

  /**
   * Query all items within a radius of (x, y)
   */
  queryRadius(x, y, radius) {
    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);

    const candidates = new Set();
    const radiusSq = radius * radius;

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const cell = this.grid.get(this._getKey(cx, cy));
        if (cell) {
          for (const item of cell) {
            candidates.add(item);
          }
        }
      }
    }

    const result = [];
    for (const item of candidates) {
      const halfW = (item.w || 40) / 2;
      const halfH = (item.h || 40) / 2;
      // Closest point on item's bounding box to (x, y)
      const closestX = Math.max(item.x - halfW, Math.min(x, item.x + halfW));
      const closestY = Math.max(item.y - halfH, Math.min(y, item.y + halfH));
      const distSq = (x - closestX) ** 2 + (y - closestY) ** 2;

      if (distSq <= radiusSq) {
        result.push(item);
      }
    }

    return result;
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.SpatialIndex = SpatialIndex;
}
