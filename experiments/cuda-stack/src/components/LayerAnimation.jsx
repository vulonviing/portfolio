import { useEffect, useState } from 'react';
import './LayerAnimation.css';
import useCanvas from '../hooks/useCanvas';

const HOST = '#e8a33d';
const DEVICE = '#49b8a8';
const CELL_OFF = '#232931';
const LINE = '#3a4250';
const FAINT = '#626c78';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpPoint(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

// Position along a polyline (array of {x,y} points) at t in [0, 1].
function pointAlongPolyline(points, t) {
  const segCount = points.length - 1;
  const scaled = Math.max(0, Math.min(1, t)) * segCount;
  let seg = Math.floor(scaled);
  if (seg >= segCount) seg = segCount - 1;
  const local = scaled - seg;
  return lerpPoint(points[seg], points[seg + 1], local);
}

function drawDot(ctx, point, color, radius = 4.5) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function labelFont(size = 10) {
  return `${size}px "IBM Plex Mono", monospace`;
}

// ---- grid: tensor (stride sweep) / kernel (warp lockstep) ----------------

function drawGrid({ ctx, width, height, time }, { variant, cols, rows }) {
  ctx.clearRect(0, 0, width, height);
  const gap = 3;
  const cellW = (width - gap * (cols - 1)) / cols;
  const cellH = (height - gap * (rows - 1)) / rows;
  const cycleMs = variant === 'warp' ? 1600 : 2400;
  const progress = ((time * 1000) % cycleMs) / cycleMs;
  const total = cols * rows;
  const activeIndex = Math.floor(progress * (variant === 'warp' ? rows : total));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const x = col * (cellW + gap);
      const y = row * (cellH + gap);
      let alpha = 0.1;
      if (variant === 'warp') {
        alpha = row === activeIndex ? 0.9 : 0.1;
      } else {
        const distance = (index - activeIndex + total) % total;
        if (distance === 0) alpha = 1;
        else if (distance === 1) alpha = 0.4;
        else if (distance === 2) alpha = 0.18;
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = DEVICE;
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH, 1.5);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ---- cycle: allocator pool reuse / runtime async lanes -------------------

function drawCyclePool({ ctx, width, height, time }) {
  ctx.clearRect(0, 0, width, height);
  const poolBox = { x: width * 0.06, y: height * 0.3, w: width * 0.3, h: height * 0.4 };
  const useBox = { x: width * 0.64, y: height * 0.3, w: width * 0.3, h: height * 0.4 };

  ctx.fillStyle = 'rgba(73, 184, 168, 0.08)';
  ctx.beginPath();
  ctx.roundRect(poolBox.x, poolBox.y, poolBox.w, poolBox.h, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(232, 163, 61, 0.08)';
  ctx.beginPath();
  ctx.roundRect(useBox.x, useBox.y, useBox.w, useBox.h, 4);
  ctx.fill();

  const cycleMs = 2600;
  const progress = ((time * 1000) % cycleMs) / cycleMs;
  // Ping-pong 0..1..0 across the cycle.
  const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
  const from = { x: poolBox.x + poolBox.w / 2, y: poolBox.y + poolBox.h / 2 };
  const to = { x: useBox.x + useBox.w / 2, y: useBox.y + useBox.h / 2 };
  const pos = lerpPoint(from, to, t);
  const color = progress < 0.5 ? DEVICE : HOST;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(pos.x - 7, pos.y - 7, 14, 14, 2);
  ctx.fill();
}

function drawCycleAsync({ ctx, width, height, time }) {
  ctx.clearRect(0, 0, width, height);
  const hostY = height * 0.3;
  const deviceY = height * 0.72;
  const marginX = 12;
  const usableW = width - marginX * 2;

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  [hostY, deviceY].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(marginX, y);
    ctx.lineTo(width - marginX, y);
    ctx.stroke();
  });

  // Host: a marker moves steadily, never pausing.
  const hostCycle = 1200;
  const hostT = ((time * 1000) % hostCycle) / hostCycle;
  drawDot(ctx, { x: marginX + usableW * hostT, y: hostY }, HOST, 4);

  // Device: a task bar fills in on its own, slower rhythm.
  const deviceCycle = 2400;
  const deviceT = ((time * 1000) % deviceCycle) / deviceCycle;
  const barW = usableW * 0.5;
  const barX = marginX + (usableW - barW) * 0.5;
  ctx.strokeStyle = DEVICE;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, deviceY - 5, barW, 10);
  ctx.fillStyle = DEVICE;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(barX, deviceY - 5, barW * Math.min(deviceT * 1.4, 1), 10);
  ctx.globalAlpha = 1;
}

// ---- route: operator / dispatcher / backend / vendor / bindings ----------

function drawRouteLinear({ ctx, width, height, time }, stops) {
  ctx.clearRect(0, 0, width, height);
  const marginX = 16;
  const y = height * 0.4;
  const usableW = width - marginX * 2;
  const points = stops.map((_, i) => ({
    x: marginX + (usableW * i) / (stops.length - 1),
    y,
  }));

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();

  ctx.font = labelFont();
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.fillStyle = '#191e25';
    ctx.strokeStyle = LINE;
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = FAINT;
    // Anchor first/last labels from the inside edge so they don't run off
    // the canvas, and alternate each label above/below the line so three
    // adjacent stop names don't collide with each other in a narrow panel.
    ctx.textAlign = i === 0 ? 'left' : i === points.length - 1 ? 'right' : 'center';
    const above = i % 2 === 1;
    ctx.fillText(stops[i], p.x, above ? p.y - 14 : p.y + 22);
  });

  const cycleMs = 3200;
  const progress = ((time * 1000) % cycleMs) / cycleMs;
  drawDot(ctx, pointAlongPolyline(points, progress), DEVICE);
}

function drawRouteBranches({ ctx, width, height, time }, { branches, activeBranch, stop }) {
  ctx.clearRect(0, 0, width, height);
  const startX = 16;
  const mergeX = width * 0.52;
  const endX = width - 16;
  const midY = height * 0.5;
  const ys = branches.map((_, i) => height * (0.22 + i * (0.56 / (branches.length - 1))));

  ctx.font = labelFont(9.5);
  branches.forEach((label, i) => {
    const isActive = i === activeBranch;
    ctx.strokeStyle = isActive ? DEVICE : LINE;
    ctx.lineWidth = isActive ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(startX, ys[i]);
    ctx.lineTo(mergeX, midY);
    ctx.stroke();
    ctx.fillStyle = isActive ? DEVICE : FAINT;
    ctx.textAlign = 'left';
    ctx.fillText(label, startX, ys[i] - 6);
  });

  ctx.strokeStyle = DEVICE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mergeX, midY);
  ctx.lineTo(endX, midY);
  ctx.stroke();
  ctx.fillStyle = DEVICE;
  ctx.textAlign = 'right';
  ctx.fillText(stop, endX, midY - 8);

  const points = [{ x: startX, y: ys[activeBranch] }, { x: mergeX, y: midY }, { x: endX, y: midY }];
  const cycleMs = 3200;
  const progress = ((time * 1000) % cycleMs) / cycleMs;
  drawDot(ctx, pointAlongPolyline(points, progress), DEVICE);
}

// ---- graph: autograd forward/backward / module compose / kernel fusion ---

function drawGraphAutograd({ ctx, width, height, time }) {
  ctx.clearRect(0, 0, width, height);
  const a = { x: width * 0.16, y: height * 0.24 };
  const b = { x: width * 0.16, y: height * 0.76 };
  const y = { x: width * 0.8, y: height * 0.5 };

  const cycleMs = 3600;
  const progress = ((time * 1000) % cycleMs) / cycleMs;
  const forward = progress < 0.5;
  const localT = forward ? progress / 0.5 : (progress - 0.5) / 0.5;
  const color = forward ? DEVICE : HOST;

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  [a, b].forEach((node) => {
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(y.x, y.y);
    ctx.stroke();
  });

  [a, b, y].forEach((node) => {
    ctx.beginPath();
    ctx.fillStyle = '#191e25';
    ctx.strokeStyle = LINE;
    ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.font = labelFont();
  ctx.fillStyle = FAINT;
  ctx.textAlign = 'right';
  ctx.fillText('a', a.x - 10, a.y + 3);
  ctx.fillText('b', b.x - 10, b.y + 3);
  ctx.textAlign = 'left';
  ctx.fillText('y = a × b', y.x + 10, y.y + 3);

  [a, b].forEach((node) => {
    const points = forward ? [node, y] : [y, node];
    drawDot(ctx, pointAlongPolyline(points, localT), color, 3.5);
  });
}

function drawGraphCompose({ ctx, width, height, time }) {
  ctx.clearRect(0, 0, width, height);
  const inputs = [
    { pos: { x: width * 0.14, y: height * 0.28 }, label: 'Parameter' },
    { pos: { x: width * 0.14, y: height * 0.72 }, label: 'forward()' },
  ];
  const out = { x: width * 0.78, y: height * 0.5 };

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  inputs.forEach(({ pos }) => {
    ctx.beginPath();
    ctx.moveTo(pos.x + 22, pos.y);
    ctx.lineTo(out.x - 26, out.y);
    ctx.stroke();
  });

  ctx.font = labelFont(9.5);
  ctx.fillStyle = FAINT;
  ctx.textAlign = 'center';
  inputs.forEach(({ pos, label }) => {
    ctx.strokeStyle = LINE;
    ctx.fillStyle = '#191e25';
    ctx.beginPath();
    ctx.roundRect(pos.x - 24, pos.y - 11, 48, 22, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = FAINT;
    ctx.fillText(label, pos.x, pos.y + 3);
  });

  const pulse = 0.5 + Math.sin(time * 2.4) * 0.08;
  ctx.fillStyle = DEVICE;
  ctx.globalAlpha = 0.16 + pulse * 0.1;
  ctx.beginPath();
  ctx.roundRect(out.x - 28, out.y - 15, 56, 30, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = DEVICE;
  ctx.beginPath();
  ctx.roundRect(out.x - 28, out.y - 15, 56, 30, 4);
  ctx.stroke();
  ctx.fillStyle = DEVICE;
  ctx.fillText('Module', out.x, out.y + 3);
}

function drawGraphFuse({ ctx, width, height, time }) {
  ctx.clearRect(0, 0, width, height);
  const starts = [
    { x: width * 0.18, y: height * 0.22 },
    { x: width * 0.18, y: height * 0.5 },
    { x: width * 0.18, y: height * 0.78 },
  ];
  const target = { x: width * 0.74, y: height * 0.5 };

  const cycleMs = 3000;
  const progress = ((time * 1000) % cycleMs) / cycleMs;
  // Hold briefly separated, then converge, then hold merged.
  const t = progress < 0.35 ? 0 : progress > 0.85 ? 1 : (progress - 0.35) / 0.5;

  starts.forEach((start, i) => {
    const pos = lerpPoint(start, target, t);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = i === 1 ? DEVICE : 'rgba(73, 184, 168, 0.55)';
    ctx.beginPath();
    ctx.roundRect(pos.x - 20, pos.y - 12, 40, 24, 3);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

const DRAW = {
  grid: (frame, config) => drawGrid(frame, config),
  cycle: (frame, config) =>
    config.variant === 'async' ? drawCycleAsync(frame) : drawCyclePool(frame),
  route: (frame, config) =>
    config.branches ? drawRouteBranches(frame, config) : drawRouteLinear(frame, config.stops),
  graph: (frame, config) => {
    if (config.variant === 'autograd') return drawGraphAutograd(frame);
    if (config.variant === 'fuse') return drawGraphFuse(frame);
    return drawGraphCompose(frame);
  },
};

export default function LayerAnimation({ config, active }) {
  // Route/branch labels are drawn with fillText; if the page's mono webface
  // hasn't loaded yet when a static (inactive) frame is painted, force one
  // redraw once it has so the label doesn't stay stuck in a fallback font.
  const [fontsReady, setFontsReady] = useState(0);

  useEffect(() => {
    document.fonts?.ready?.then(() => setFontsReady((n) => n + 1));
  }, []);

  const draw = (frame) => {
    if (!frame.width || !frame.height) return;
    DRAW[config.kind]?.(frame, config);
  };

  const { canvasRef } = useCanvas(draw, {
    active,
    deps: [config.kind, JSON.stringify(config), fontsReady],
  });

  return (
    <div className="layer-animation panel">
      <canvas ref={canvasRef} className="layer-animation__canvas" />
    </div>
  );
}
