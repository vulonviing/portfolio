import { useEffect, useMemo, useState } from 'react';
import './ActOneMachine.css';
import { useLang } from '../i18n/LanguageProvider';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import useCanvas from '../hooks/useCanvas';

const CYCLE_MS = 6000;
const GPU_BURST_FRACTION = 0.08;
const HOST_COLOR = '#e8a33d';
const DEVICE_COLOR = '#49b8a8';
const CELL_OFF = '#232931';

function useCycleProgress(cycleMs, active) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    let raf;
    let last = 0;
    const loop = (now) => {
      if (now - last > 80) {
        setProgress((now % cycleMs) / cycleMs);
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cycleMs, active]);

  return progress;
}

function drawHostGrid({ ctx, width, height, time }) {
  ctx.clearRect(0, 0, width, height);
  const cores = 8;
  const gap = 8;
  const size = Math.min((width - gap * (cores - 1)) / cores, height * 0.5);
  const y = (height - size) / 2;
  const totalWidth = cores * size + (cores - 1) * gap;
  const startX = (width - totalWidth) / 2;

  const cycle = (time * 1000) % CYCLE_MS;
  const progress = cycle / CYCLE_MS;
  const activeIndex = Math.floor(progress * cores) % cores;

  for (let i = 0; i < cores; i += 1) {
    const x = startX + i * (size + gap);
    ctx.fillStyle = i === activeIndex ? HOST_COLOR : CELL_OFF;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 3);
    ctx.fill();
  }
}

function drawDeviceGrid({ ctx, width, height, time }) {
  ctx.clearRect(0, 0, width, height);
  const cols = 24;
  const rows = 10;
  const gap = 3;
  const cellW = (width - gap * (cols - 1)) / cols;
  const cellH = (height - gap * (rows - 1)) / rows;

  const cycle = (time * 1000) % CYCLE_MS;
  const progress = cycle / CYCLE_MS;

  let intensity;
  if (progress < GPU_BURST_FRACTION) {
    intensity = progress / GPU_BURST_FRACTION;
  } else {
    const settle = (progress - GPU_BURST_FRACTION) / (1 - GPU_BURST_FRACTION);
    intensity = 1 - settle * 0.55;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * (cellW + gap);
      const y = row * (cellH + gap);
      const jitter = ((row * cols + col) % 7) * 0.015;
      const alpha = Math.max(0, Math.min(1, intensity - jitter)) * 0.85 + 0.06;
      ctx.fillStyle = DEVICE_COLOR;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH, 1.5);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function CpuGpuPanels({ active }) {
  const { canvasRef: hostRef } = useCanvas(drawHostGrid, { active });
  const { canvasRef: deviceRef } = useCanvas(drawDeviceGrid, { active });

  return (
    <div className="machine-panels">
      <div className="machine-panel">
        <canvas ref={hostRef} className="machine-canvas machine-canvas--host" />
      </div>
      <div className="machine-panel">
        <canvas ref={deviceRef} className="machine-canvas machine-canvas--device" />
      </div>
    </div>
  );
}

export default function ActOneMachine() {
  const { t } = useLang();
  const reducedMotion = usePrefersReducedMotion();
  const active = !reducedMotion;
  const progress = useCycleProgress(CYCLE_MS, active);

  const { cpuCount, gpuCount } = useMemo(() => {
    const total = 1_000_000;
    const cpu = Math.floor(progress * total);
    const gpu =
      progress < GPU_BURST_FRACTION
        ? Math.floor((progress / GPU_BURST_FRACTION) * total)
        : total;
    return { cpuCount: cpu, gpuCount: gpu };
  }, [progress]);

  const fmt = (n) => n.toLocaleString('en-US');

  return (
    <section className="section act1">
      <div className="container">
        <div className="kicker">
          <span className="kicker__index">act 01</span>
          <span>{t.act1.title}</span>
        </div>

        <h2 className="section__title">{t.act1.cpuGpu.title}</h2>
        <p className="act1__task">{t.act1.cpuGpu.task}</p>

        <CpuGpuPanels active={active} />

        <div className="machine-legend">
          <div className="machine-legend__item">
            <span className="machine-legend__swatch machine-legend__swatch--host" />
            <div>
              <div className="machine-legend__label">{t.act1.cpuGpu.cpuLabel}</div>
              <p className="machine-legend__desc">{t.act1.cpuGpu.cpuDesc}</p>
              <div className="machine-legend__count">
                {fmt(cpuCount)} <span>{t.act1.cpuGpu.counterLabel}</span>
              </div>
            </div>
          </div>
          <div className="machine-legend__item">
            <span className="machine-legend__swatch machine-legend__swatch--device" />
            <div>
              <div className="machine-legend__label">{t.act1.cpuGpu.gpuLabel}</div>
              <p className="machine-legend__desc">{t.act1.cpuGpu.gpuDesc}</p>
              <div className="machine-legend__count">
                {fmt(gpuCount)} <span>{t.act1.cpuGpu.counterLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cuda-entry">
          <h3 className="cuda-entry__title">{t.act1.cudaEntry.title}</h3>
          <div className="cuda-path cuda-path--old">
            <span className="cuda-path__label">{t.act1.cudaEntry.oldLabel}</span>
            <code className="cuda-path__route">{t.act1.cudaEntry.oldPath}</code>
          </div>
          <div className="cuda-path cuda-path--new">
            <span className="cuda-path__label">{t.act1.cudaEntry.newLabel}</span>
            <code className="cuda-path__route">{t.act1.cudaEntry.newPath}</code>
          </div>
          <p className="cuda-entry__body">{t.act1.cudaEntry.body}</p>
        </div>

        <div className="misconception">
          <div className="misconception__main">
            <h3 className="misconception__title">{t.act1.misconception.title}</h3>
            <p className="misconception__body">{t.act1.misconception.body}</p>
            <p className="misconception__note">{t.act1.misconception.coreNote}</p>
          </div>
          <div className="misconception__amd">
            <h4 className="misconception__amd-title">{t.act1.misconception.amdTitle}</h4>
            <p className="misconception__amd-body">{t.act1.misconception.amdBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
