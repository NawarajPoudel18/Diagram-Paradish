/**
 * SnapManager.js
 * Snap Detection & Visual Feedback Engine for Diagram Paradish.
 * Manages configurable snap radius, candidate detection, and live visual snap highlights.
 */

class SnapManager {
  constructor(config = {}) {
    this.config = {
      snapRadius: 24, // Configurable snap radius (in canvas pixels)
      anchorPriority: 'approach', // 'approach' | 'nearest'
      ...config
    };

    this.activeSnap = {
      isSnapped: false,
      candidateComp: null,
      anchor: null,
      absX: 0,
      absY: 0,
      distance: Infinity
    };
  }

  /**
   * Set configuration options
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Continuous snap detection for cursor position
   * @param {SpatialIndex} spatialIndex - Spatial Hash Grid instance
   * @param {number} mx - Canvas mouse X
   * @param {number} my - Canvas mouse Y
   * @param {Object|null} sourcePoint - Wire start point { x, y }
   * @param {string|null} excludeCompId - Component ID to exclude (e.g. wire start comp)
   * @returns {Object} Active snap result
   */
  detectSnap(spatialIndex, mx, my, sourcePoint = null, excludeCompId = null) {
    if (!spatialIndex) {
      this.clearSnap();
      return this.activeSnap;
    }

    const searchRadius = this.config.snapRadius + 60;
    const nearbyComps = spatialIndex.queryRadius(mx, my, searchRadius);

    let bestCandidate = null;
    let minDistance = Infinity;

    for (const comp of nearbyComps) {
      if (excludeCompId && comp.id === excludeCompId) continue;

      const bestAnchorData = AnchorManager.selectBestAnchor(
        comp,
        mx,
        my,
        sourcePoint,
        this.config.anchorPriority
      );

      if (bestAnchorData && bestAnchorData.distance <= this.config.snapRadius) {
        if (bestAnchorData.distance < minDistance) {
          minDistance = bestAnchorData.distance;
          bestCandidate = {
            candidateComp: comp,
            anchor: bestAnchorData.anchor,
            absX: bestAnchorData.absX,
            absY: bestAnchorData.absY,
            distance: bestAnchorData.distance,
            index: bestAnchorData.index
          };
        }
      }
    }

    if (bestCandidate) {
      this.activeSnap = {
        isSnapped: true,
        candidateComp: bestCandidate.candidateComp,
        anchor: bestCandidate.anchor,
        absX: bestCandidate.absX,
        absY: bestCandidate.absY,
        distance: bestCandidate.distance
      };
    } else {
      this.clearSnap();
    }

    return this.activeSnap;
  }

  /**
   * Clear active snap state
   */
  clearSnap() {
    this.activeSnap = {
      isSnapped: false,
      candidateComp: null,
      anchor: null,
      absX: 0,
      absY: 0,
      distance: Infinity
    };
  }

  /**
   * Render real-time visual feedback overlays (Shape Highlight + Active Anchor Snap Ring)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} scale - Current canvas zoom scale
   * @param {Object} theme - Current color theme
   */
  renderVisualFeedback(ctx, scale = 1, theme = {}) {
    if (!this.activeSnap.isSnapped || !this.activeSnap.candidateComp) return;

    const comp = this.activeSnap.candidateComp;
    const anc = this.activeSnap.anchor;
    const accentColor = theme.accent || '#1a6bcc';

    ctx.save();

    // 1. Draw candidate shape highlight outline
    const w = comp.w || 100;
    const h = comp.h || 50;
    const hw = w / 2;
    const hh = h / 2;

    ctx.save();
    ctx.translate(comp.x, comp.y);

    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10 / scale;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([4 / scale, 4 / scale]);

    ctx.beginPath();
    ctx.rect(-hw - 4, -hh - 4, w + 8, h + 8);
    ctx.stroke();
    ctx.restore();

    // 2. Draw all connection anchors on candidate shape faintly
    const allAnchors = AnchorManager.getAbsoluteAnchors(comp);
    allAnchors.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.absX, a.absY, 3.5 / scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(26, 107, 204, 0.4)';
      ctx.fill();
    });

    // 3. Highlight the active snapped anchor with a pulsing snap ring
    if (anc) {
      const time = Date.now() / 200;
      const pulseSize = (8 + Math.sin(time) * 1.5) / scale;

      // Outer pulsing aura
      ctx.beginPath();
      ctx.arc(anc.absX, anc.absY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(26, 107, 204, 0.25)';
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();

      // Inner snap dot
      ctx.beginPath();
      ctx.arc(anc.absX, anc.absY, 4 / scale, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      // Snap crosshair target lines
      const crossSize = 7 / scale;
      ctx.beginPath();
      ctx.moveTo(anc.absX - crossSize, anc.absY);
      ctx.lineTo(anc.absX + crossSize, anc.absY);
      ctx.moveTo(anc.absX, anc.absY - crossSize);
      ctx.lineTo(anc.absX, anc.absY + crossSize);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2 / scale;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.SnapManager = SnapManager;
}
