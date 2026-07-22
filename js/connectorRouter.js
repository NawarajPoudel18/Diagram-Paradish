/**
 * ConnectorRouter.js
 * Smart Connector Path Routing & Renderer Engine.
 * Calculates Orthogonal and Straight connector paths with anchor direction support.
 */

class ConnectorRouter {
  /**
   * Calculate path points for a connector between (x1, y1) and (x2, y2)
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {string} style - 'ortho' or 'straight'
   * @param {Object|null} startAnchor - Optional start anchor metadata
   * @param {Object|null} endAnchor - Optional end anchor metadata
   * @returns {Array} Array of point objects [{ x, y }]
   */
  static getRoutePoints(x1, y1, x2, y2, style = 'ortho', startAnchor = null, endAnchor = null) {
    if (style === 'straight') {
      return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    }

    // Orthogonal routing logic
    const points = [{ x: x1, y: y1 }];

    // Check anchor normals if available
    const startNormal = startAnchor ? { x: startAnchor.normalX || 0, y: startAnchor.normalY || 0 } : null;
    const endNormal = endAnchor ? { x: endAnchor.normalX || 0, y: endAnchor.normalY || 0 } : null;

    if (startNormal && (Math.abs(startNormal.y) > 0.5)) {
      // Exiting vertically (Top/Bottom anchor)
      const midY = (y1 + y2) / 2;
      points.push({ x: x1, y: midY });
      points.push({ x: x2, y: midY });
    } else if (startNormal && (Math.abs(startNormal.x) > 0.5)) {
      // Exiting horizontally (Left/Right anchor)
      const midX = (x1 + x2) / 2;
      points.push({ x: midX, y: y1 });
      points.push({ x: midX, y: y2 });
    } else {
      // Default midpoint orthogonal breakdown
      const midX = (x1 + x2) / 2;
      points.push({ x: midX, y: y1 });
      points.push({ x: midX, y: y2 });
    }

    points.push({ x: x2, y: y2 });
    return points;
  }

  /**
   * Draw a connector line along route points
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Array} points - Array of {x,y} route points
   * @param {Object} options - Drawing options { color, width, dash, isSelected, scale }
   */
  static drawRoutePath(ctx, points, options = {}) {
    if (!points || points.length < 2) return;

    const {
      color = '#1a6bcc',
      width = 2,
      dash = [],
      scale = 1
    } = options;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width / scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (dash.length > 0) {
      ctx.setLineDash(dash.map(d => d / scale));
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw arrowhead at the end of a connector
   */
  static drawArrowhead(ctx, fromX, fromY, toX, toY, color = '#1a6bcc', scale = 1) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const size = 9 / scale;

    ctx.save();
    ctx.translate(toX, toY);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.4);
    ctx.lineTo(-size * 0.75, 0);
    ctx.lineTo(-size, size * 0.4);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.ConnectorRouter = ConnectorRouter;
}
