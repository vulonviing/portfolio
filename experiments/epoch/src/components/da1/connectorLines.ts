/**
 * connectorLines — SVG path math for the DA1 mapping board.
 *
 * Computes cubic-bezier paths between field boxes (left column) and catalog
 * target chips (right column).  All coordinates are relative to the SVG
 * overlay element (getBoundingClientRect of the overlay as origin).
 */

export interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Convert a DOM element's bounding rect into overlay-relative coordinates. */
export function toOverlayRect(
  el: Element,
  overlay: Element,
): AnchorRect {
  const elRect = el.getBoundingClientRect();
  const ovRect = overlay.getBoundingClientRect();
  return {
    top: elRect.top - ovRect.top,
    left: elRect.left - ovRect.left,
    width: elRect.width,
    height: elRect.height,
  };
}

/** Return the right-edge mid-point of a rect (field box anchor). */
export function rightMid(r: AnchorRect): [number, number] {
  return [r.left + r.width, r.top + r.height / 2];
}

/** Return the left-edge mid-point of a rect (catalog chip anchor). */
export function leftMid(r: AnchorRect): [number, number] {
  return [r.left, r.top + r.height / 2];
}

/**
 * Build an SVG cubic-bezier path string connecting a right-edge anchor (field
 * box) to a left-edge anchor (catalog chip).  The control-point offset scales
 * with the horizontal distance so the curve looks natural at any separation.
 */
export function cubicPath(
  from: [number, number],
  to: [number, number],
): string {
  const dx = Math.max(60, Math.abs(to[0] - from[0]) * 0.5);
  const [fx, fy] = from;
  const [tx, ty] = to;
  return `M ${fx} ${fy} C ${fx + dx} ${fy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

/**
 * Build a dashed stub path going right from a field box anchor (used for
 * excluded fields to show the connection was severed).
 */
export function stubPath(from: [number, number]): string {
  const [fx, fy] = from;
  return `M ${fx} ${fy} L ${fx + 40} ${fy}`;
}
