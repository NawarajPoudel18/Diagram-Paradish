/**
 * ConnectionManager.js
 * Master Connection & Connector Lifecycle Manager.
 * Orchestrates spatial index, anchor detection, snapping engine, dynamic routing, and wire endpoint editing.
 */

class ConnectionManager {
  constructor(spatialIndex, snapManager) {
    this.spatialIndex = spatialIndex || new SpatialIndex();
    this.snapManager = snapManager || new SnapManager();

    // Wire creation state
    this.wireStart = null; // { comp, pin, x, y, anchor }
    this.tempMouse = null; // { x, y }

    // Existing wire endpoint dragging state
    this.draggingWireEnd = null; // { wire, end: 'from' | 'to', otherComp, otherPin }
  }

  /**
   * Start creating a new wire from a component and anchor
   */
  startWire(comp, anchorIndex, absX, absY) {
    const anchors = AnchorManager.getAbsoluteAnchors(comp);
    const anchor = anchors[anchorIndex] || { absX, absY, index: anchorIndex };

    this.wireStart = {
      comp,
      pin: anchorIndex,
      x: anchor.absX,
      y: anchor.absY,
      anchor
    };
    this.tempMouse = { x: anchor.absX, y: anchor.absY };
  }

  /**
   * Start dragging an existing wire's endpoint
   */
  startDraggingWireEndpoint(wire, end, comps) {
    const fromComp = comps.find(c => c.id === wire.from);
    const toComp = comps.find(c => c.id === wire.to);

    if (end === 'from') {
      const toAnchors = toComp ? AnchorManager.getAbsoluteAnchors(toComp) : [];
      const toAbs = toAnchors[wire.toPin] || {
        absX: toComp ? toComp.x : (wire.toX !== undefined ? wire.toX : 0),
        absY: toComp ? toComp.y : (wire.toY !== undefined ? wire.toY : 0)
      };

      this.wireStart = {
        comp: toComp || null,
        pin: wire.toPin,
        x: toAbs.absX,
        y: toAbs.absY,
        anchor: toAnchors[wire.toPin] || null
      };
      this.draggingWireEnd = { wire, end: 'from' };
    } else {
      const fromAnchors = fromComp ? AnchorManager.getAbsoluteAnchors(fromComp) : [];
      const fromAbs = fromAnchors[wire.fromPin] || {
        absX: fromComp ? fromComp.x : (wire.fromX !== undefined ? wire.fromX : 0),
        absY: fromComp ? fromComp.y : (wire.fromY !== undefined ? wire.fromY : 0)
      };

      this.wireStart = {
        comp: fromComp || null,
        pin: wire.fromPin,
        x: fromAbs.absX,
        y: fromAbs.absY,
        anchor: fromAnchors[wire.fromPin] || null
      };
      this.draggingWireEnd = { wire, end: 'to' };
    }
  }

  /**
   * Handle mouse move during wire drawing or dragging
   */
  handleMouseMove(mx, my) {
    if (!this.wireStart) return;

    this.tempMouse = { x: mx, y: my };

    const sourcePoint = { x: this.wireStart.x, y: this.wireStart.y };
    const excludeCompId = this.wireStart.comp ? this.wireStart.comp.id : null;

    // Detect snap with approach vector support
    this.snapManager.detectSnap(
      this.spatialIndex,
      mx,
      my,
      sourcePoint,
      excludeCompId
    );
  }

  /**
   * Handle mouse release to complete wire connection or update endpoint
   * @param {Array} wires - Global wires array
   * @param {string} wireStyle - Active wire style ('ortho' | 'straight')
   * @returns {boolean} True if wire was connected/modified
   */
  handleMouseUp(wires, wireStyle = 'ortho') {
    if (!this.wireStart) return false;

    const snapState = this.snapManager.activeSnap;

    if (this.draggingWireEnd) {
      const { wire } = this.draggingWireEnd;
      if (snapState.isSnapped && snapState.candidateComp) {
        if (this.draggingWireEnd.end === 'from') {
          wire.from = snapState.candidateComp.id;
          wire.fromPin = snapState.anchor.index;
          delete wire.fromX; delete wire.fromY;
        } else {
          wire.to = snapState.candidateComp.id;
          wire.toPin = snapState.anchor.index;
          delete wire.toX; delete wire.toY;
        }
      } else if (this.tempMouse) {
        // Released on empty canvas: detach endpoint to floating coordinates
        if (this.draggingWireEnd.end === 'from') {
          wire.from = null;
          wire.fromX = this.tempMouse.x;
          wire.fromY = this.tempMouse.y;
        } else {
          wire.to = null;
          wire.toX = this.tempMouse.x;
          wire.toY = this.tempMouse.y;
        }
      }
      this.cancelWire();
      return true;
    }

    if (snapState.isSnapped && snapState.candidateComp) {
      if (snapState.candidateComp !== this.wireStart.comp) {
        wires.push({
          from: this.wireStart.comp.id,
          fromPin: this.wireStart.pin,
          to: snapState.candidateComp.id,
          toPin: snapState.anchor.index,
          style: wireStyle
        });
        this.cancelWire();
        return true;
      }
    } else if (this.tempMouse && this.wireStart && this.wireStart.comp) {
      // Create floating connector endpoint on empty canvas release
      wires.push({
        from: this.wireStart.comp.id,
        fromPin: this.wireStart.pin,
        to: null,
        toX: this.tempMouse.x,
        toY: this.tempMouse.y,
        style: wireStyle
      });
      this.cancelWire();
      return true;
    }

    this.cancelWire();
    return false;
  }

  /**
   * Cancel wire creation/dragging
   */
  cancelWire() {
    this.wireStart = null;
    this.tempMouse = null;
    this.draggingWireEnd = null;
    this.snapManager.clearSnap();
  }

  /**
   * Render preview wire and visual snap feedback on canvas
   */
  renderPreview(ctx, scale = 1, theme = {}, wireStyle = 'ortho') {
    if (!this.wireStart || !this.tempMouse) return;

    const startX = this.wireStart.x;
    const startY = this.wireStart.y;
    const snapState = this.snapManager.activeSnap;

    const targetX = snapState.isSnapped ? snapState.absX : this.tempMouse.x;
    const targetY = snapState.isSnapped ? snapState.absY : this.tempMouse.y;

    const routePoints = ConnectorRouter.getRoutePoints(
      startX,
      startY,
      targetX,
      targetY,
      wireStyle,
      this.wireStart.anchor,
      snapState.isSnapped ? snapState.anchor : null
    );

    // Draw preview line
    ConnectorRouter.drawRoutePath(ctx, routePoints, {
      color: theme.wire || '#1a6bcc',
      width: 2,
      dash: [6, 4],
      scale
    });

    // Draw arrowhead pointing to cursor / target anchor
    if (routePoints.length >= 2) {
      const pPrev = routePoints[routePoints.length - 2];
      const pEnd = routePoints[routePoints.length - 1];
      ConnectorRouter.drawArrowhead(
        ctx,
        pPrev.x,
        pPrev.y,
        pEnd.x,
        pEnd.y,
        theme.wire || '#1a6bcc',
        scale
      );
    }

    // Draw start anchor highlight
    ctx.save();
    ctx.beginPath();
    ctx.arc(startX, startY, 5 / scale, 0, Math.PI * 2);
    ctx.fillStyle = theme.wire || '#1a6bcc';
    ctx.fill();
    ctx.restore();

    // Render snap visual feedback overlay
    this.snapManager.renderVisualFeedback(ctx, scale, theme);
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.ConnectionManager = ConnectionManager;
}
