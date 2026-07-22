/**
 * AnchorManager.js
 * Standardized Anchor Point Engine for all diagram elements.
 * Provides 8-point cardinal/corner anchors, shape-specific pins, and approach-based anchor selection.
 */

class AnchorManager {
  /**
   * Get all standardized anchors for a given component in relative coordinates
   * @param {Object} comp - Component object { type, w, h, x, y }
   * @returns {Array} Array of relative anchor objects
   */
  static getRelativeAnchors(comp) {
    const w = comp.w || 100;
    const h = comp.h || 50;
    const hw = w / 2;
    const hh = h / 2;

    // Standard 8 cardinal + corner anchors for general shapes
    const standardAnchors = [
      { id: 'top', name: 'Top Center', x: 0, y: -hh, normalX: 0, normalY: -1 },
      { id: 'right', name: 'Right Center', x: hw, y: 0, normalX: 1, normalY: 0 },
      { id: 'bottom', name: 'Bottom Center', x: 0, y: hh, normalX: 0, normalY: 1 },
      { id: 'left', name: 'Left Center', x: -hw, y: 0, normalX: -1, normalY: 0 },
      { id: 'top-left', name: 'Top Left Corner', x: -hw, y: -hh, normalX: -0.707, normalY: -0.707 },
      { id: 'top-right', name: 'Top Right Corner', x: hw, y: -hh, normalX: 0.707, normalY: -0.707 },
      { id: 'bottom-right', name: 'Bottom Right Corner', x: hw, y: hh, normalX: 0.707, normalY: 0.707 },
      { id: 'bottom-left', name: 'Bottom Left Corner', x: -hw, y: hh, normalX: -0.707, normalY: 0.707 }
    ];

    // Specific shape overrides or additions
    switch (comp.type) {
      case 'resistor':
      case 'capacitor':
      case 'inductor':
      case 'led':
      case 'gate_not':
        return [
          { id: 'pin0', name: 'Left Terminal', x: comp.type === 'inductor' ? -40 : (comp.type === 'resistor' ? -32 : -25), y: 0, normalX: -1, normalY: 0 },
          { id: 'pin1', name: 'Right Terminal', x: comp.type === 'inductor' ? 40 : (comp.type === 'resistor' ? 32 : 25), y: 0, normalX: 1, normalY: 0 },
          ...standardAnchors
        ];

      case 'voltage':
        return [
          { id: 'pin0', name: 'Top Terminal', x: 0, y: -34, normalX: 0, normalY: -1 },
          { id: 'pin1', name: 'Bottom Terminal', x: 0, y: 34, normalX: 0, normalY: 1 },
          ...standardAnchors
        ];

      case 'ground':
        return [
          { id: 'pin0', name: 'Top Pin', x: 0, y: -24, normalX: 0, normalY: -1 },
          ...standardAnchors
        ];

      case 'nmos':
        return [
          { id: 'gate', name: 'Gate', x: -28, y: 0, normalX: -1, normalY: 0 },
          { id: 'drain', name: 'Drain', x: 20, y: -20, normalX: 0, normalY: -1 },
          { id: 'source', name: 'Source', x: 20, y: 20, normalX: 0, normalY: 1 },
          ...standardAnchors
        ];

      case 'gate_and':
      case 'gate_or':
      case 'gate_nand':
      case 'gate_nor':
      case 'gate_xor':
      case 'gate_xnor':
        return [
          { id: 'in1', name: 'Input 1', x: -25, y: -8, normalX: -1, normalY: 0 },
          { id: 'in2', name: 'Input 2', x: -25, y: 8, normalX: -1, normalY: 0 },
          { id: 'out', name: 'Output', x: 25, y: 0, normalX: 1, normalY: 0 },
          ...standardAnchors
        ];

      default:
        return standardAnchors;
    }
  }

  /**
   * Get all anchors in absolute canvas world coordinates for a component
   * @param {Object} comp - Component object
   * @returns {Array} Array of absolute anchor objects
   */
  static getAbsoluteAnchors(comp) {
    const rels = AnchorManager.getRelativeAnchors(comp);
    return rels.map((anchor, index) => ({
      ...anchor,
      index,
      shapeId: comp.id,
      absX: comp.x + anchor.x,
      absY: comp.y + anchor.y
    }));
  }

  /**
   * Select the best matching anchor on a shape based on mouse cursor and approach vector
   * @param {Object} comp - Target shape object
   * @param {number} mx - Current cursor X
   * @param {number} my - Current cursor Y
   * @param {Object|null} sourcePoint - Optional connector origin point { x, y }
   * @param {string} priority - 'approach' or 'nearest'
   * @returns {Object} Best anchor object with { anchor, distance, absX, absY }
   */
  static selectBestAnchor(comp, mx, my, sourcePoint = null, priority = 'approach') {
    const anchors = AnchorManager.getAbsoluteAnchors(comp);
    if (!anchors.length) return null;

    let bestAnchor = null;
    let minScore = Infinity;
    let minDistance = Infinity;

    // Calculate approach vector if source point exists
    let approachX = 0;
    let approachY = 0;

    if (sourcePoint) {
      const dx = mx - sourcePoint.x;
      const dy = my - sourcePoint.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.001) {
        approachX = dx / len;
        approachY = dy / len;
      }
    } else {
      // Fallback approach direction based on cursor relative to shape center
      const dx = mx - comp.x;
      const dy = my - comp.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.001) {
        approachX = dx / len;
        approachY = dy / len;
      }
    }

    anchors.forEach((anc) => {
      const dist = Math.hypot(anc.absX - mx, anc.absY - my);

      let score = dist;

      if (priority === 'approach') {
        // Calculate dot product between line direction and anchor normal direction
        // Higher dot product means the anchor is facing the direction the connector is coming from
        // Incoming direction to anchor is opposite of approach direction (-approachX, -approachY)
        const dot = (-approachX * anc.normalX) + (-approachY * anc.normalY);
        
        // Give bonus for anchors facing the approach vector
        const approachBonus = dot * 12; // 12px effective score discount for aligned anchors
        score = dist - approachBonus;
      }

      if (dist < minDistance) {
        minDistance = dist;
      }

      if (score < minScore) {
        minScore = score;
        bestAnchor = {
          anchor: anc,
          distance: dist,
          absX: anc.absX,
          absY: anc.absY,
          index: anc.index,
          id: anc.id
        };
      }
    });

    return bestAnchor;
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.AnchorManager = AnchorManager;
}
